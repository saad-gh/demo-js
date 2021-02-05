from flask import g, redirect, url_for, current_app
from app.auth.xero.auth import refresh_token
from app.database.db import DB
from app.database.sage.db import OEINVD, OEINVH, PORCPH1, PORCPL, OECRDH
from app.database.sqlite.db import Sage_xero_currency_mapping
from datetime import datetime
import pytz
import os
import requests
import json
import pandas as pd
import warnings

INV_FIELDS = {
    # Primitive fields
    "PRIM" : ('Type','Date','DueDate','LineAmountTypes','InvoiceNumber','Reference','BrandingThemeID','Url','CurrencyCode','CurrencyRate','Status','SentToContact','ExpectedPaymentDate','PlannedPaymentDate'),
    # Line items
    "LINEITEMS" : ('Description','Quantity','UnitAmount','DiscountAmount','AccountCode')
}

END_POINTS = {
    "INVOICE" : "https://api.xero.com/api.xro/2.0/Invoices?unitdp=4",
    "CREDITNOTES" : "https://api.xero.com/api.xro/2.0/CreditNotes",
    "MANUALJOURNALS" : "https://api.xero.com/api.xro/2.0/ManualJournals"
}

# @refresh_token
def request_endpoint(uri, data, t_id):
    xero = g.user["xero"]

    headers ={
        'Authorization': 'Bearer ' + xero["access_token"],
        'Content-Type': 'application/json',
        'Accept' : 'application/json',
        'Xero-tenant-id' : t_id
    }

    return requests.post(uri,headers=headers,data=json.dumps(data))

def request_header(t_id):
    xero = g.user["xero"]

    return {
        'Authorization': 'Bearer ' + xero["access_token"],
        'Content-Type': 'application/json',
        'Accept' : 'application/json',
        'Xero-tenant-id' : t_id
    }

RELATION = {
    'one' : 0,
    'many' : 1
}

FILE_NAMES = {
    'sale' : ('OEINVH_Jan_2020_CSV', 'OEINVD_Jan_2020_CSV'),
    'bill' : ('PORCPH1_Jan_2020_CSV','PORCPL_Jan_2020_CSV')
}

COLUMNS = {
    'sale' : ('INVUNIQ,BILNAME,INVDATE,INVNUMBER,INSOURCURR,INRATE,INVDISCPER,INVDISCAMT','INVUNIQ,[DESC],QTYSHIPPED,UNITPRICE,ITEM,TAUTH1,TAMOUNT1,CATEGORY,UNITCOST,ACCTSET'),
    'bill' : ('RCPHSEQ,VDNAME,[DATE],RCPNUMBER,CURRENCY,RATE,TAXGROUP,TAXAMOUNT1','RCPHSEQ,ITEMDESC,RQRECEIVED,UNITCOST,ITEMNO,DISCPCT,DISCOUNT','CNTLACCT'),
    'credit-note': ('RETDATE,BILNAME,CRDNUMBER,CRDUNIQ','CATEGORY,QTYRETURN,UNITPRICE,CRDUNIQ,[DESC]'),
    'manual-journal' : ('INVUNIQ,BILNAME,INVDATE,INVNUMBER,INSOURCURR,INRATE,INVDISCPER,INVDISCAMT','INVUNIQ,[DESC],QTYSHIPPED,UNITPRICE,ITEM,TAUTH1,TAMOUNT1,CATEGORY,UNITCOST,ACCTSET'),
}

SUPPRESS_SCIENTIFIC_COL = {
    'sale' : (None,'3'),
    'bill' : (None,'3'),
    'credit-note' : (None,'2')
}

DATE_COL = {
    'sale' : ('2',None),
    'bill' : ('2',None),
    'credit-note' : ('0',None)
}

STRIP_COL = {
    'sale' : ('1,3','1,4,5,7,9'),
    'bill' : ('1,3','1,4','0'),
    'credit-note':('1,2','0,4')
}

INT_STR_COL = {
    'sale' : ('5,6,7','2,3,6,9'),
    'bill' : ('5,7','2,3,5,6','0'),
    'credit-note' : (None,'1,2')
}

TABLES = {
    'sale' : ('OEINVH','OEINVD'),
    'bill' : ('PORCPH1','PORCPL','ICITEM'),
    'credit-note' : ('OECRDH','OECRDD'),
    'manual-journal' : ('OEINVH','OEINVD')
}

KEYS = {
    'sale' : 'INVUNIQ',
    'bill' : 'RCPHSEQ',
    'credit-note' : 'CRDUNIQ',
    'manual-journal' : 'INVUNIQ'
}

MAP = {
    'sale' : [
        ('BILNAME','Contact'),
        ('INVDATE','Date'),
        ('INVNUMBER','Reference'),
        ('INSOURCURR','CurrencyCode'),
        ('INRATE','CurrencyRate'),
        ('[DESC]','Description'),
        ('QTYSHIPPED','Quantity'),
        ('UNITPRICE','UnitAmount'),
        # ('ITEM','ItemCode'),
        # ('TAUTH1','TaxType'),
        ('TAMOUNT1','TaxAmount'),
        ('INVDISCPER','DiscountRate'),
        ('INVDISCAMT','DiscountAmount'),
        ('CATEGORY','AccountCode')
    ],
    'bill' : [
        ('VDNAME','Contact'),
        ('[DATE]','Date'),
        # Not required in bill
        # ('RCPNUMBER','Reference'),
        ('RCPNUMBER','InvoiceNumber'),
        ('CURRENCY','CurrencyCode'),
        ('RATE','CurrencyRate'),
        ('ITEMDESC','Description'),
        ('RQRECEIVED','Quantity'),
        ('UNITCOST','UnitAmount'),
        # ('ITEMNO','ItemCode'),
        # ('TAXGROUP','TaxType'),
        ('TAXAMOUNT1','TaxAmount'),
        ('CNTLACCT','AccountCode')

    ],
    'credit-note':[
        ('RETDATE','Date'),
        ('BILNAME','Contact'),
        ('CATEGORY','AccountCode'),
        ('CRDNUMBER','Reference'),
        ('QTYRETURN','Quantity'),
        ('UNITPRICE','UnitAmount'),
        ('[DESC]','Description')
    ],
    'manual-journal':[
        ('INVDATE','Date'),
        ('INVNUMBER','Narration'),
        ('[DESC]','Description'),
        ('ACCTSET','AccountCode'),
        ('LineAmount','LineAmount') # calculated later UNITCOST x QTYSHIPPED
    ],
    'gl-sale':[
        ('00ORT,00OSE,00POS,00RED,00SPK,00WHT,0CGNC,0HMRS,0PORT,0ROSE,DESRTW,GRPWT,OPENR,SPKRS,WGLAS','46101'),
        ('0BEER,BBEER,BGLAS,KBEER,PROMO','46111'),
        ('00GIN,LIQUR,LSRDR,TEQLA,VODKA,WHSKY','46121'),
        ('00HM,CHMRS,00CHM','46131'),
        ('0MEIT','44101')
    ],
    'gl-bill':[
        ('1000,3000,4000,4100','18004'),
        ('2000','18006'),
        ('5000','18007'),
        ('6000','1810'),
        ('ADVTS','18003')
    ],
    'gl-cogs':[
        ('46101','54007'),
        ('46111','54015'),
        ('46121','54025'),
        ('46131','54035')
    ],
    'gl-inventory':[
        ('1000,3000,4000,4100','18004'),
        ('2000','18006'),
        ('5000','18007'),
        ('6000','1810'),
        ('ADVTS','18003')
    ]
}

LI_COL = {
    'sale' : (5,6,7,8,9,10,11,12),
    'bill' : (5,6,7,8,9,10)
}

def col_func(data, indexer, inv_type, func):
    for k in range(0,len(indexer[inv_type])):
        indexes = indexer[inv_type][k]
        if indexes:
            indexes = list(map(int,indexes.split(',')))
            cols = COLUMNS[inv_type][k].split(',')
            cols = list(map(
                lambda c: ''.join(_c for _c in c if _c not in '[]'),
                [cols[ind] for ind in indexes]
            ))
            data[cols] = data[cols].apply(func)
    return data

def one_many(inv_type, period):
    for r in ('one','many'):
        yield DB(
            # get db table class
            globals()[TABLES[inv_type][RELATION[r]]]
        ).find(
            fields = COLUMNS[inv_type][RELATION[r]],
            filter = period
        )

def joined_(inv_type, period):
    c1 =','.join(list(map(lambda c: f'{c[0]}.{c[1]}',list(zip(
        [TABLES[inv_type][0] for c in range(0,len(COLUMNS[inv_type][0].split(',')))],
        COLUMNS[inv_type][0].split(',')
    )))))
    c2 =','.join(list(map(lambda c: f'{c[0]}.{c[1]}',list(zip(
        [TABLES[inv_type][1] for c in range(0,len(COLUMNS[inv_type][1].split(',')))],
        COLUMNS[inv_type][1].split(',')
    )))))
    c = c1 + ',' + c2
    if inv_type == 'bill':
        c3 = ','.join(list(map(lambda c: f'{c[0]}.{c[1]}',list(zip(
            [TABLES[inv_type][2] for c in range(0,len(COLUMNS[inv_type][2].split(',')))],
            COLUMNS[inv_type][2].split(',')
        )))))
        c += ',' + c3
    return DB(
        # get db table class
        globals()[TABLES[inv_type][RELATION['one']]]
    ).find_join(
        fields = c,
        filter = period
    )

def map_api_schema(inv_type, sage_map):
    '''Returns sage data frame columns and xero api field names
    '''
    for r in ('one', 'many'):
        sage = list(
            # reduce to api li fields
            filter(
                lambda c: c in sage_map,
                COLUMNS[inv_type][RELATION[r]].split(',')
            )
        )
        xero = [c[1] for c in MAP[inv_type] if c[0] in sage]

        # removing square brackets from columns names
        yield [''.join(_ for _ in c if _ not in '[]') for c in sage] 
        yield xero

def prep_payload(inv_type, period, res_sale = None):
    ''' api fields are mapped to sage db columns whose schema is different to xero api payload. Major transformation is for line items and addition; 'type' field
    '''
    # Update MAP
    if inv_type in ('bill','sale'):
        pairs = DB(Sage_xero_currency_mapping).find_2(
            many = True,
            fields = ('sage_code','xero_code')
        )
        if pairs:
            MAP['sage_xero_curr_code'] = pairs
            
    joined = None
    timestamp = datetime.strftime(datetime.now(pytz.timezone("Asia/Singapore")),"%y%m%d%H%M")

    if 'DEBUG_PREP_PAYLOAD' in current_app.config.keys():
        joined = (yield)
    elif inv_type == "manual-journal":
        joined = (yield)
    else:
        joined = joined_(inv_type, period)
        current_app.wlog.info(f'{inv_type} sage db data received')

        path = os.path.join(
            current_app.instance_path, 'data',
            f'raw_{inv_type}_{timestamp}.csv'
        )
        warnings.warn("assuming unique columns in one to many tables")
        joined.to_csv(
            path,
            index=False
        )
        warnings.warn("Reloading because of non 1-dimensional grouper key returned from join query")
        joined = pd.read_csv(path)

    if joined.empty:
        yield None, timestamp


    if inv_type in ('sale','bill','credit-note'):
        # suppressing scientific notation
        joined = joined.round(4)
        # if inv_type == 'bill':
        #     joined['UNITCOST'] = joined['UNITCOST'].apply(lambda c: '{:f}'.format(c))

        # directive: (indexers for columns, functions for their transformation)
        directives = (
            # (SUPPRESS_SCIENTIFIC_COL, lambda c: '{:f}'.format(c.astype(float))),
            (INT_STR_COL, lambda c: c.astype(str)),
            (DATE_COL, lambda c: c.astype(str).apply(lambda c: c[0:4] + '-' + c[4:6] + '-' + c[6:8])),
            (STRIP_COL, lambda c: c.str.strip())
        )
        for d in directives:
            joined = col_func(joined,d[0],inv_type,d[1])

        if inv_type in ('sale','credit-note'):
            # Add GL Codes
            for gl in MAP['gl-sale']:
                joined.loc[joined['CATEGORY'].isin(gl[0].split(',')),'CATEGORY'] = gl[1]

        elif inv_type == 'bill':
            for gl in MAP['gl-bill']:
                # incase category ADVTS is not available this will be parsed as an int column
                joined['CNTLACCT'] = joined['CNTLACCT'].astype(str)
                joined.loc[joined['CNTLACCT'].isin(gl[0].split(',')),'CNTLACCT'] = gl[1]

        if inv_type in ('sale','bill') and 'sage_xero_curr_code' in MAP.keys():
            currency_column = 'INSOURCURR' if inv_type == 'sale' else 'CURRENCY'
            for sx in MAP['sage_xero_curr_code']:
                joined.loc[joined[currency_column].isin(sx[0].split(',')),currency_column] = sx[1]
        
        # if inv_type == 'sale':
        #     joined['INVNUMBER'] = 'pikai_' + timestamp + '_' + joined['INVNUMBER']
        # elif inv_type == 'credit-note':
        #     joined['CRDNUMBER'] = 'pikai_' + timestamp + '_' + joined['CRDNUMBER']
        # elif inv_type == 'bill':
        #     joined['RCPNUMBER'] = 'pikai_' + timestamp + '_' + joined['RCPNUMBER']                     

    elif inv_type == "manual-journal":
        joined = joined[joined['QTYSHIPPED'].astype(float) != 0]
        joined['CATEGORY'] = joined['CATEGORY'].astype(str)
        joined['ACCTSET'] = joined['ACCTSET'].astype(str)

        for gl in MAP['gl-inventory']:
            joined.loc[joined['ACCTSET'].isin(gl[0].split(',')),'ACCTSET'] = gl[1]
        for gl in MAP['gl-cogs']:
            joined.loc[joined['CATEGORY'].isin(gl[0].split(',')),'CATEGORY'] = gl[1]
        joined['LineAmount'] = joined['UNITCOST'].astype(float) * joined['QTYSHIPPED'].astype(float)
        joined['LineAmount'] = joined['LineAmount'].astype(str)
        joined['INVNUMBER'] = 'Cost of Sales for ' + joined['INVNUMBER']

    joined.to_csv(
        os.path.join(
            current_app.instance_path, 'data',
            f'processed_{inv_type}_{timestamp}.csv'
        ),
        index=False
    )
    current_app.wlog.info(f'{inv_type} processed saved')

    sage_map, _ = zip(*MAP[inv_type]) # _ contains xero mapping fields which are not used
    sage_payload, xero_payload, sage_li, xero_li = map_api_schema(inv_type, sage_map)

    # fixing mapping
    if inv_type == 'sale':
        # discounts are mentioned in xero sale invoice line items
        transfer = (
            ('INVDISCPER','DiscountRate'),
            ('INVDISCAMT','DiscountAmount')
        )
        for t in transfer:
            sage_li.append(sage_payload.pop(sage_payload.index(t[0])))
            xero_li.append(xero_payload.pop(xero_payload.index(t[1])))
    elif inv_type == 'bill':
        # account code (gl codes) coming from ICITEM not PORCPL line items table
        sage_li.append('CNTLACCT')
        xero_li.append('AccountCode')
    elif inv_type == 'manual-journal':
        sage_li.append('LineAmount')
        xero_li.append('LineAmount')

    KEY_LI = 'JournalLines' if inv_type == 'manual-journal' else 'LineItems'
    # Refer to doc string
    xero_payload.append(KEY_LI)
    sage_payload.append(KEY_LI)

    if inv_type in ('sale','bill','credit-note'):
        sage_payload.append('Type')
        xero_payload.append('Type')

    i_max = len(xero_li)
    i_desc = None
    i_la = None
    i_nar = None
    if inv_type == 'manual-journal':
        i_desc = xero_li.index('Description')
        # index line amount
        i_la = xero_li.index('LineAmount')
        i_nar = xero_payload.index('Narration')

    joined[KEY_LI] = '{'
    for i in range(0, i_max):
        # manual journal customization
        if not i_desc is None and i_desc == i:
            joined[KEY_LI] += '"' + xero_li[i_desc] + '"' + ':' + '"' +  joined[sage_payload[i_nar]] + ',' + joined[sage_li[i_desc]] + '"'
        elif not i_la is None and i_la == i:
            joined[KEY_LI] += '"' + xero_li[i_la] + '"' + ':' + '"-' + joined[sage_li[i_la]] + '"'
        else:
            joined[KEY_LI] += '"' + xero_li[i] + '"' + ':' + '"' + joined[sage_li[i]] + '"'
        if i < i_max - 1:
            joined[KEY_LI] += ','
    joined[KEY_LI] += '}'

    if inv_type == 'manual-journal':
        # replace inventory account with cost of sales
        sage_li[sage_li.index('ACCTSET')] = 'CATEGORY'
        joined[KEY_LI] += ',{'
        for i in range(0, i_max):
            # manual journal customization
            if not i_desc is None and i_desc == i:
                joined[KEY_LI] += '"' + xero_li[i_desc] + '"' + ':' + '"' + joined[sage_payload[i_nar]] + ',' + joined[sage_li[i_desc]] + '"'
            else:
                joined[KEY_LI] += '"' + xero_li[i] + '"' + ':' + '"' + joined[sage_li[i]] + '"'
            if i < i_max - 1:
                joined[KEY_LI] += ','
        joined[KEY_LI] += '}'

        current_app.wlog.info('journal entry added for cost of sales account')

    grouped = joined.groupby([KEYS[inv_type]])
    payload = grouped.nth(0)
    payload[KEY_LI] = '[' + grouped[KEY_LI].apply(','.join) + ']'

    if inv_type == 'sale':
        payload['Type'] = 'ACCREC'
    elif inv_type == 'bill':
        payload['Type'] = 'ACCPAY'
    elif inv_type == 'credit-note':
        payload['Type'] = 'ACCRECCREDIT'  

    # reference for later updates
    i_cont = None
    i_dt = None
    i_li = xero_payload.index(KEY_LI)
    
    if inv_type in ('sale','bill','credit-note'):
        i_cont = xero_payload.index('Contact')
    if inv_type in ('sale','bill'):
        i_dt = xero_payload.index('Date')
    
    i_max = len(sage_payload)
    for i in range(0, i_max):
        if i == 0:
            payload['payload'] = '{'

        if not i_cont is None and i == i_cont:
            payload['payload'] += '"' + xero_payload[i_cont] + '"' + ':' + (
                '{' +
                '"Name":"' + payload[sage_payload[i_cont]] + 
                '"}'
            )
        elif not i_dt is None and i == i_dt:
            payload['payload'] += '"' + xero_payload[i] + '"' + ':' + '"' + payload[sage_payload[i]] + '"' + ','
            payload['payload'] += '"DueDate"' + ':' + '"' + payload[sage_payload[i]] + '"'
        elif i == i_li:
            payload['payload'] += '"' + xero_payload[i_li] + '"' + ':' + payload[sage_payload[i_li]]
        else:
            payload['payload'] += '"' + xero_payload[i] + '"' + ':' + '"' + payload[sage_payload[i]] + '"' 
            
        if i < i_max - 1:
            payload['payload'] += ','
        else:
            payload['payload'] += '}'

    yield payload, timestamp