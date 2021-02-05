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
from app.database.sqlite.db import User

bp = Blueprint("auth_db", __name__, url_prefix="/auth/app")

def login_required(view):
    """View decorator that redirects anonymous users to the login page."""

    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for("auth_db.login",next=request.endpoint))

        return view(**kwargs)

    return wrapped_view


@bp.before_app_request
def load_logged_in_user():
    """If a user id is stored in the session, load the user object from
    the database into ``g.user``."""
    user_id = session.get("user_id")

    # preserving session in case of xero redirect
    if not user_id and request.url_rule.rule == url_for('auth_xero.xero_redirect'):
        user_id = request.args.get('state')
        session['user_id'] = user_id

    if user_id is None:
        g.user = None
    else:
        g.user = (
            dict(DB(User).find(id=user_id))
        )

def redirect_dest(fallback):
    dest = request.args.get('next')
    try:
        dest_url = url_for(dest)
    except:
        return redirect(fallback)
    return redirect(dest_url)

@bp.route("/login", methods=("GET", "POST"))
def login():
    """Log in a registered user by adding the user id to the session."""
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
       
        error = None
        user = DB(User).find(username=username)

        if user is None:
            error = "Incorrect username."
        elif not check_password_hash(user["password"], password):
            error = "Incorrect password."

        if error is None:
            # store the user id in a new session and return to the index
            session.clear()
            session["user_id"] = user["id"]
            return redirect_dest(url_for("act_xero.migrate"))

        flash(error,'error')

    return render_template("auth/login.html")

@bp.route("/logout")
def logout():
    """Clear the current session, including the stored user id."""
    session.clear()
    return redirect(url_for("auth_db.login"))

@bp.route("/change-user",methods=('GET','POST'))
@login_required
def change_user():
    if request.method == 'POST':
        error = None

        username = request.form["username"]
        old_password = request.form["old_password"]

        db = DB(User)

        user = db.find(username=username)
        if not check_password_hash(user["password"],old_password):
            error = "Incorrect old password."

        new_password = request.form["new_password"]
        retype_password = request.form["retype_password"]

        if not new_password == retype_password:
            error = "Passwords do not match."

        if not error is None:
            flash(error,'error')
            return render_template("auth/change-user.html", preserved = {
                'old_password' : old_password,
                'new_password' : new_password,
                'retype_password' : retype_password
            })

        # Pending update method. Important password would need to be stored as hash
        DB(User).update(username=username, password=new_password)

        flash("Change successful.")
        return redirect(url_for("auth_db.login"))

    return render_template('auth/update.html')