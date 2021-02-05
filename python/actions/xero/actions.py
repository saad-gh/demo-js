# https://stackoverflow.com/questions/22878743/how-to-split-dictionary-into-multiple-dictionaries-fast
from itertools import islice
from flask import Blueprint, request, render_template, flash, url_for, redirect, current_app, send_file
from app.auth.app.auth import login_required
from app.database.xero.api import request_endpoint, request_header, INV_FIELDS, END_POINTS, prep_payload, DATE_COL, TABLES, COLUMNS
from app.auth.xero.auth import load_cred, refresh_token
from app.database.sage.db import OEINVH, PORCPH1
from app.database.db import DB
from app.database.sqlite.db import Sage_xero_currency_mapping

import json
import glob
import os
import platform
import csv
import pandas as pd
import requests

bp = Blueprint("act_xero",__name__,url_prefix="/actions/xero")
bp.before_request(load_cred)

@bp.route('/download/<filename>',methods=('GET',))
@login_required
def download(filename):
    return send_file(os.path.join(current_app.instance_path,'data',filename),
                     mimetype='text/csv',
                     attachment_filename=f'{filename}.csv',
                     as_attachment=True)

@bp.route('/migrate',methods=('GET','POST'))
@login_required
@refresh_token
def migrate():
    if not os.path.exists(os.path.join(current_app.instance_path,'tenant_ids.csv')):
        return redirect(url_for('auth_xero.authorize'))

    t_ids = None
    with open(os.path.join(current_app.instance_path,'tenant_ids.csv')) as f:
        t_ids = [{k : v for k, v in row.items()} for row in csv.DictReader(f, skipinitialspace=True)]

    if request.method == 'POST':
        f = ''.join(request.form['from'].split('-'))
        t = ''.join(request.form['to'].split('-'))
        t_id = request.form['t_id']
        currencymap = [v.split(',') for k,v in request.form.items() if k.startswith('mappedinput')]
        if currencymap:
            for cm in currencymap:
                res = requests.put(
                    'https://api.xero.com/api.xro/2.0/Currencies',
                    headers = request_header(t_ids[0]['tenantId']),
                    data = json.dumps({'Code':cm[1]})
                )
            # if hetro pair insert into db
            cm_manual = [(e[0],e[1]) for e in currencymap if int(e[2])]
            DB(Sage_xero_currency_mapping).insert_2(
                fields = ('sage_code','xero_code'),
                values = cm_manual,
                many = True
            )

        if not t_ids[0]['tenantId'] == t_id:
            for t in t_ids:
                if t['tenantId'] == t_id:
                    t_ids.insert(0,t_ids.pop(t))
                    break

            keys = t_ids[0].keys()
            with open(os.path.join(current_app.instance_path,'tenant_ids.csv'), 'w') as output_file:
                dict_writer = csv.DictWriter(output_file, keys)
                dict_writer.writeheader()
                dict_writer.writerows(t_ids)

        period = None
        error = None
        timestamp_sale = None

        for type_ in ('sale','credit-note','manual-journal','bill'):
            if type_ in ('sale','credit-note','bill'):
                col = COLUMNS[type_][0].split(',')[int(DATE_COL[type_][0])]
                period = f'{TABLES[type_][0]}.{col} >= {f} AND {TABLES[type_][0]}.{col} <= {t}'

            corou = prep_payload(type_,period)
            if type_ in ('sale','credit-note','bill'):
                d,_ = corou.__next__()
                if type_ == 'sale':
                    timestamp_sale = _
            elif type_ == "manual-journal":
                p = os.path.join(current_app.instance_path,'data',f'processed_sale_{timestamp_sale}.csv')
                if os.path.exists(p):
                    corou.__next__()
                    d,_ = corou.send(
                        pd.read_csv(p)
                    )
                else:
                    d = None
            
            payload = None
            ep = None

            if d is None:
                if error is None:
                    error = f'*No record found for {type_}*'
                else:
                    error += f', *No record found for {type_}*'
            elif type_ in ('sale','bill'):
                payload = (
                    '{"Invoices":[' +
                    ','.join(d['payload']) +
                    ']}'
                )
                ep = END_POINTS["INVOICE"]
            elif type_ == 'credit-note':
                payload = (
                    '{"CreditNotes":[' +
                    ','.join(d['payload']) +
                    ']}'
                )
                ep = END_POINTS["CREDITNOTES"]
            elif type_ == 'manual-journal':
                payload = (
                    '{"ManualJournals":[' +
                    ','.join(d['payload']) +
                    ']}'
                )
                ep = END_POINTS["MANUALJOURNALS"]

            if payload:
                res = request_endpoint(ep,json.loads(payload),t_id)
                current_app.wlog.info(f'{ep} returned {res.status_code}')
                # if not 'Windows' in platform.platform():
                #     current_app.logger.info(f'{ep} returned {res.status_code}')
            else:
                current_app.wlog.info(f'no {type_} found')
        
        if error:
            flash(error,'error')
                
        if 'TEST_MIGRATE' in current_app.config.keys():
            return b'success'
    else:
        # if os.getenv('TEST_CURRENCY_MAPPING'):
        #     flash('MRF','error_currencies')
        #     flash('AUD','error_currencies')
        # else:
        # xero currencies
        _cr = requests.get(
            'https://api.xero.com/api.xro/2.0/Currencies',
            headers = request_header(t_ids[0]['tenantId'])
        )
        if _cr.status_code == 200:
            currencies_xero = set([_['Code'] for _ in json.loads(_cr.content)['Currencies']])

            currencies_sage = set(DB(OEINVH).find_distinct(fields = ('INSOURCURR',))['INSOURCURR'])
            currencies_sage |= set(DB(PORCPH1).find_distinct(fields = ('CURRENCY',))['CURRENCY'])

            currencies_sage_only = currencies_sage.difference(currencies_xero)
            if currencies_sage_only:             
                currencies_xero_only = currencies_xero.difference(currencies_sage)
                
                # chance of mapping
                if currencies_xero_only:
                    pairs = DB(Sage_xero_currency_mapping).find_2(
                        fields = ('sage_code','xero_code'),
                        where = f'sage_code IN ({",".join("?"*len(currencies_sage_only))})',
                        values = tuple(currencies_sage_only),
                        many = True
                    )
                    
                    if pairs:
                        for p in pairs:
                            currencies_sage_only = currencies_sage_only.difference(set((p['sage_code'],)))
                
                for c in currencies_sage_only:
                    flash(c,'error_currencies')
        else:
            flash('currencies not received','error')

    path_sep = '\\' if 'Windows' in platform.platform() else '/'
    f = [
        p.split(path_sep)[-1] for p in glob.glob(os.path.join(current_app.instance_path,'data','processed_*.csv'))
    ]

    # sort based on latest date and time
    f.sort(reverse=True, key=lambda _: int(_.split('_')[2].split('.')[0]))

    return render_template('actions/migrate.html', f=f[:15] if len(f) >= 15 else f, t_ids=t_ids)

# @bp.route('/migrate',methods=('GET','POST'))
# @login_required
# def migrate():
#     if request.method == 'POST':
#         f = ''.join(request.form['from'].split('-'))
#         t = ''.join(request.form['to'].split('-'))
#         period = None
#         error = None
#         payloads = []
#         for type_ in ('sale','bill','credit-note'):
#             col = COLUMNS[type_][0].split(',')[int(DATE_COL[type_][0])]
#             period = f'{TABLES[type_][0]}.{col} >= {f} AND {TABLES[type_][0]}.{col} <= {t}'
                
#             d,_ = prep_payload(type_,period).__next__()
#             if d is None:
#                 if error is None:
#                     error = ""
#                 error += f'no record found for {type_} '
#                 # maintaining types_ sequence integrity
#                 payloads.append(None)
#                 continue

#             payloads.append(','.join(d['payload']))

#         if not payloads:
#             pass
#         else:
#             ep = None
#             payload = None

#             for type_ in ('Invoices','CreditNotes'):
#                 if type_ == 'Invoices':
#                     p_inv = list(filter(None,payloads[:2]))
#                     if p_inv:
#                         payload = (
#                             '{' + f'"{type_}":[' +
#                             ','.join(p_inv) +
#                             ']}'
#                         )                    
#                     ep = END_POINTS["INVOICE"]
#                 elif type_ == 'CreditNotes':
#                     p_crd = None if payloads[2] is None else payloads[2]
#                     if p_crd:
#                         payload = (
#                             '{' + f'"{type_}":[' +
#                             p_crd +
#                             ']}'
#                         )
#                     ep = END_POINTS["CREDITNOTES"]
                
#                 if payload:
#                     current_app.wlog.info(f'{ep} returned {request_endpoint(ep,json.loads(payload)).status_code}')
#                 else:
#                     current_app.wlog.info(f'no {type_} found')
        
#         if error:
#             flash(error)
                
#         if 'TEST_MIGRATE' in current_app.config.keys():
#             return b'success'

#     path_sep = '\\' if 'Windows' in platform.platform() else '/'
#     f = [
#         p.split(path_sep)[-1] for p in glob.glob(os.path.join(current_app.instance_path,'data','processed_*.csv'))
#     ]
#     # sort based on latest date and time
#     f.sort(reverse=True, key=lambda _: int(_.split('_')[2].split('.')[0]))
#     return render_template('actions/migrate.html', f=f)

def dict_chunks(data, SIZE=10000):
    it = iter(data)
    for _ in range(0, len(data), SIZE):
        yield {k:data[k] for k in islice(it, SIZE)}

def get_post_data():
    return request.form.to_dict()

@bp.route('/add-invoice/<inv_type>',methods=["GET","POST"])
def add_invoice(inv_type):
    preserved = {
        "LINEITEMS" : list(INV_FIELDS["LINEITEMS"]).__str__()
    }

    if request.method == "POST":
        error = None
        post_data = get_post_data()

        # Extracting everything exept line items
        payload = dict()
        for f in INV_FIELDS["PRIM"]:
            if f in post_data:
                payload[f] = post_data.pop(f)        
        payload["Type"] = inv_type
        payload["Contact"] = {
            "Name" : post_data.pop('Contact')
        }
        # Extracting line items
        line_items = [items for items in dict_chunks(post_data,len(INV_FIELDS["LINEITEMS"]))]

        if len(line_items) == 0:
            error = "At least one line item is required"
            preserved["Contact"] = payload["Contact"]["Name"]
            preserved["Date"] = payload["Date"]       

        if error is None:
            line_items = [dict(zip(INV_FIELDS["LINEITEMS"],items.values())) for items in line_items]
            payload['LineItems'] = line_items  
            res = request_endpoint(END_POINTS["INVOICE"],payload)
            if 'error' in res.keys() and res['error'] == 'invalid_grant':
                return redirect(url_for('auth_xero.authorize'))
        else:
            flash(error,"error")    

    return render_template('actions/add-invoice.html',preserved = preserved)