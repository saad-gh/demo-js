import os
import click
import platform

from flask import Flask, redirect, jsonify, url_for
from flask.cli import with_appcontext
from dotenv import load_dotenv

import logging
__wlog__ = 'werkzeug'
__glog__ = 'general'

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    load_dotenv(
        dotenv_path=os.path.join(
            app.instance_path,'.env'
        )
    )

    # configure logging
    fh = logging.FileHandler(
        os.path.join(app.instance_path,f'{__wlog__}.log')
    )
    fh.setLevel(logging.INFO)
    fh.setFormatter(
        logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    )
    app.wlog = logging.getLogger(__wlog__)

    # if not 'Windows' in platform.platform():
    #     fh = logging.FileHandler(
    #         os.path.join(app.instance_path,f'{__glog__}.log')
    #     )
    #     fh.setLevel(logging.INFO)
    #     fh.setFormatter(
    #         logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    #     )
    #     app.logger.addHandler(fh)

    def init_app():
        from .database.db import DB
        from .database.sqlite.db import Base
        db = DB(Base)
        db.init()

        username = click.prompt("Enter root username",default="pikai")
        password = click.prompt("Enter root password",default=os.getenv('ROOT_PWD'))
        client_id = click.prompt("Enter client id",default=os.getenv('XERO_CID'))
        client_secret = click.prompt("Enter client secret",default=os.getenv('XERO_CS'))
        redirect_uri = click.prompt("Enter redirect uri",default="http://localhost:5000/auth/xero/redirect")

        from .database.sqlite.db import User, Cred_app
        db = DB(User)
        db.insert(**{
            "username" : username,
            "password" : password
        })

        user = db.find(username=username)
        db = DB(Cred_app)
        db.insert(
            **{
                "client_id" : client_id,
                "client_secret" : client_secret,
                "redirect" : redirect_uri,
                "user_id" : user["id"]
            }
        )

    @click.command('init-app')
    @with_appcontext
    def init_app_command():
        init_app()
        click.echo("App initialized")

    app.cli.add_command(init_app_command)

    # Pending init xero app and sage database credentials
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY'),
        DATABASE=os.path.join(app.instance_path,'sagexero.sqlite'),
        DATE_TIME_FORMAT="%Y-%m-%dT%H:%M:%S",
        TEST_REFRESH_TOKEN = False
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    from .database.db import DB
    app.teardown_appcontext(DB.close_db(key='db_app'))
    app.teardown_appcontext(DB.close_db(key='db_sage'))

    from .auth.app.auth import bp as app_auth
    from .auth.xero.auth import bp as xero_auth
    from .actions.xero.actions import bp as xero_act
    app.register_blueprint(app_auth)
    app.register_blueprint(xero_auth)
    app.register_blueprint(xero_act)
    # app.register_blueprint(auth.sage.auth.bp)
    # app.register_blueprint(auth.xero.auth.bp)

    @app.route("/")
    def index():
        return redirect(url_for('act_xero.migrate'))

    return app