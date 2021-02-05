# Pending update import according to PEP8
import os, csv

from flask import Blueprint, redirect, request, current_app, render_template, g, flash, session, url_for

import requests as req
from requests.auth import HTTPBasicAuth
from datetime import datetime
import json, functools

from app.auth.app.auth import login_required

from app.database.db import DB
from app.database.sqlite.db import User, Cred_app, Cred_xero

bp = Blueprint('auth_xero',__name__,url_prefix='/auth/xero')

@login_required
def load_cred():
    user = g.user
    user["xero"] = dict()
    xero = user["xero"]

    db = DB(Cred_app)
    cred = db.find(user_id=g.user["id"])

    xero["client_id"] = cred["client_id"]
    xero["client_secret"] = cred["client_secret"]
    xero["redirect"] = cred["redirect"]

    db = DB(Cred_xero)
    cred = db.find(user_id=g.user["id"])
    if not cred is None:
        xero["access_token"] = cred["access_token"]
        xero["refresh_token"] = cred["refresh_token"]
        xero["token_received"] = cred["token_received"]
        xero["tenant_id"] = cred["tenant_id"]
    else:
        return redirect(url_for("auth_xero.authorize"))

@bp.route('/authorize')
@login_required
def authorize():
    db = DB(Cred_app)
    cred = db.find(user_id=g.user["id"])
    xero = dict()
    xero["client_id"] = cred["client_id"]
    xero["client_secret"] = cred["client_secret"]
    xero["redirect"] = cred["redirect"]

    # revoke existing connections
    db = DB(Cred_xero)
    user_cred = db.find_one()
    if not user_cred is None:
        uri = 'https://identity.xero.com/connect/revocation'
        headers = {
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
        data = {
            'token' : user_cred['refresh_token']
        }
        res = req.post(uri,auth=HTTPBasicAuth(xero["client_id"], xero["client_secret"]),headers=headers,data=data)
        current_app.wlog.info(f'On revoking: {res.status_code}')        

    return redirect(
        "https://login.xero.com/identity/connect/authorize?response_type=code&client_id=" + xero["client_id"] + "&redirect_uri=" + xero["redirect"] + f"&scope=accounting.transactions accounting.settings offline_access&state={g.user['id']}"
        )

HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH']
@bp.route('/redirect',methods=HTTP_METHODS)
def xero_redirect(): # Pending needs to be secure
    if 'TEST_HALT' in current_app.config.keys():
        return b'TEST_HALT'

    db = DB(Cred_app)
    cred = db.find_one()
    xero = dict()
    xero["client_id"] = cred["client_id"]
    xero["client_secret"] = cred["client_secret"]
    xero["redirect"] = cred["redirect"]

    code = request.args.get('code')
    uri = 'https://identity.xero.com/connect/token'
    headers = {
        'Content-Type' : 'application/x-www-form-urlencoded'
    }
    data = {
        'grant_type' : 'authorization_code',
        'code' : code,
        'redirect_uri' : xero["redirect"]
    }
    res = req.post(uri,auth=HTTPBasicAuth(xero["client_id"], xero["client_secret"]),headers=headers,data=data)
    json_data = json.loads(res.content)
    access_token = json_data.pop('access_token', None)

    if access_token:
        refresh_token = json_data['refresh_token']
        user_id = cred['user_id'] 
        tenant_id = get_tenant_id(access_token)

        db = DB(Cred_xero)
        cred_xero = db.find_one()
        if not cred_xero is None:
            db.update(
                user_id = user_id,
                access_token = access_token,
                tenant_id = tenant_id,
                refresh_token = refresh_token,
                token_received = datetime.strftime(datetime.now(),current_app.config["DATE_TIME_FORMAT"])
            )
        else:
            db.insert(
                user_id = user_id,
                access_token = access_token,
                tenant_id = tenant_id,
                refresh_token = refresh_token,
                token_received = datetime.strftime(datetime.now(),current_app.config["DATE_TIME_FORMAT"])
            )
    else:
        flash('Please try reauthorizing xero account','error')
    
    return redirect(url_for("act_xero.migrate")) 

def get_tenant_id(access_token):
    uri = 'https://api.xero.com/connections'
    headers ={
        'Authorization': 'Bearer ' + access_token,
        'Content-Type': 'application/json'
    }
    res = req.get(uri,headers=headers)
    json_data = json.loads(res.content)

    keys = json_data[0].keys()
    with open(os.path.join(current_app.instance_path,'tenant_ids.csv'), 'w') as output_file:
        dict_writer = csv.DictWriter(output_file, keys)
        dict_writer.writeheader()
        dict_writer.writerows(json_data)
    return json_data[0]['tenantId']

def refresh_token(request_endpoint): 

    @functools.wraps(request_endpoint)
    def wrapped_request_endpoint(*args,**kwargs):
        """Manages access token"""
        db = DB(Cred_app)
        cred = db.find(user_id=g.user["id"])
        xero = dict()
        xero["client_id"] = cred["client_id"]
        xero["client_secret"] = cred["client_secret"]
        xero["redirect"] = cred["redirect"]

        db = DB(Cred_xero)
        cred = db.find(user_id=g.user["id"])    
        xero["access_token"] = cred["access_token"]
        xero["refresh_token"] = cred["refresh_token"]
        xero["token_received"] = cred["token_received"]
        xero["tenant_id"] = cred["tenant_id"]        

        received_at = datetime.strptime(xero["token_received"],current_app.config["DATE_TIME_FORMAT"])
        delta = datetime.now() - received_at
        days_diff = delta.days
        minutes_diff = None
        if days_diff == 0:
            minutes_diff = delta.total_seconds() / 60.0
        
        # if int(os.getenv('TEST_REFRESH_TOKEN')) or minutes_diff == None or minutes_diff > 28:
        if minutes_diff == None or minutes_diff > 28:
            # Refresh access token
            uri = "https://identity.xero.com/connect/token"
            headers = {
                'Content-Type' : 'application/x-www-form-urlencoded'
            }
            data = {
                'grant_type' : 'refresh_token',
                'refresh_token' : xero["refresh_token"]
            }
            res = req.post(uri,auth=HTTPBasicAuth(xero["client_id"], xero["client_secret"]),headers=headers,data=data)
            json_data = json.loads(res.content)
            access_token = json_data.pop("access_token", None)
            if access_token:
                refresh_token = json_data["refresh_token"]
                token_received = datetime.strftime(datetime.now(),current_app.config["DATE_TIME_FORMAT"])

                user_id = session.get("user_id")

                # Pending tenant id is only updated because update query is not dynamic
                db.update(
                    user_id = user_id,
                    access_token = access_token,
                    tenant_id = cred["tenant_id"],
                    refresh_token = refresh_token,
                    token_received = token_received
                )

                load_cred()
            else:
                flash('Access token not received on refresh, please reauthorize xero account. If the issue persists contact the developer','error')

        return request_endpoint(*args,**kwargs)
    return wrapped_request_endpoint