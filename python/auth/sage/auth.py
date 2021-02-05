import functools

from flask import Blueprint
from flask import flash
from flask import g
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash

from app.database.db import DB
from app.database.sqlite import User
from app.auth.app import login_required

bp = Blueprint("auth_sage", __name__, url_prefix="/auth/sage")

@bp.route("/cred-sage",methods=('GET','POST'))
@login_required
def cred_sage():
    if request.method == 'POST': # Pending http verb should be different for updating. It should be PUT
        error = None

        username = request.form["username"]
        password = request.form["password"]
        server = request.form["server"]
        port = request.form["port"]
        user_id = g.user["id"]

        # Pending Cred_sage class
        DB(Cred_sage).insert(
            username=username,
            password=password,
            server=server,
            port=port,
            user_id=user_id
        )
        
        return redirect(url_for("db.login"))

    return render_template('auth/cred-sage.html') # Pending cred-sage template
        