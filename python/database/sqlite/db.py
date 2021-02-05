# Pending update according to pep8
import sqlite3, json
from flask import g, current_app
from werkzeug.security import generate_password_hash
from datetime import datetime
import traceback

class Flags(object):
    is_transaction_open = False
class Base(object):
    __tablename__ = None
    def __init__(self):
        """Connect to the application's configured database. The connection
        is unique for each request and will be reused if this is called
        again.
        """
        if "db_app" not in g:
            g.db_app = sqlite3.connect(
                current_app.config["DATABASE"], detect_types=sqlite3.PARSE_DECLTYPES
            )
            g.db_app.row_factory = sqlite3.Row

        self.db = g.db_app
    
    def getconnection(self):
        return self.db

    def init(self):
        with current_app.open_resource("database/sqlite/init.sql",mode="rb") as f:
            self.db.executescript(f.read().decode('utf-8'))

    def find_one(self):
        if self.__tablename__ is None:
            raise NotImplementedError

        return self.db.execute(
            f'SELECT * FROM {self.__tablename__} LIMIT 1'
        ).fetchone()

    def builder_2(self,**kwargs):
        if self.__tablename__ is None:
            raise NotImplementedError()
        
        many = None
        if 'many' in kwargs.keys():
            many = kwargs.pop('many')
        
        columns = None
        if many in (False, None):
            columns = ', '.join(kwargs.keys())
        else:
            columns = ', '.join(kwargs['fields'])

        placeholders = ', '.join('?' * (columns.count(',') + 1))
        return f'INSERT INTO {self.__tablename__} ({columns}) VALUES ({placeholders})', many

    def insert_2(self,**kwargs):
        date_key = kwargs.pop('date_key',None)
        sql, many = self.builder_2(**kwargs)

        if not date_key is None:
            if many in (None, False):
                kwargs[date_key] = datetime.strftime(kwargs[date_key], format = current_app.config["DATE_TIME_FORMAT"])
            else:
                _ = kwargs['values'][kwargs['fields'].index(date_key)]
                kwargs['values'][kwargs['fields'].index(date_key)] = datetime.strftime(_, format = current_app.config["DATE_TIME_FORMAT"])

        self.db.execute(sql, values = tuple(kwargs.values())) if many in (None,False) else self.db.executemany(sql, kwargs['values'])

        if not Flags.is_transaction_open:
            self.db.commit()

    def update_2(self, **kwargs):
        if self.__tablename__ is None:
            raise NotImplementedError()

        fields = kwargs['fields']
        date_key = kwargs.pop('date_key',None)
        if not date_key is None:
            fields[date_key] = datetime.strftime(fields[date_key], format = current_app.config["DATE_TIME_FORMAT"])
        values = tuple(tuple(fields.values()) + kwargs['values'])
        fields = f'{" = ?, ".join(fields.keys())}  = ?'
        
        where = kwargs['where']
        sql = (
            f'UPDATE {self.__tablename__} SET {fields} WHERE {where}'
        )
        try:
            self.db.execute(sql, values)
        except Exception:
            traceback.print_exc()
            return None

        if not Flags.is_transaction_open:
            self.db.commit()

    def find_2(self,**kwargs):
        if self.__tablename__ is None:
            raise NotImplementedError()
        
        fields = kwargs.pop('fields', None)
        where = kwargs.pop('where', None)
        many = kwargs.pop('many', None)
        if fields:
            fields = ','.join(fields)
        sql = f'SELECT {"*" if fields is None else fields} FROM {self.__tablename__}'
        data = None

        if where:            
            sql = f'{sql} WHERE {where}'
            try:
                data = self.db.execute(sql,kwargs.pop('values'))
            except Exception:
                traceback.print_exc()
                return None
        else:
            try:
                data = self.db.execute(sql)
            except Exception:
                traceback.print_exc()
                return None            

        return data.fetchall() if many else data.fetchone()


# Pending sql statments could be less verbose
class User(Base):
    __tablename__ = 'user'
    def insert(self,**kwargs):
        """https://stackoverflow.com/questions/14108162/python-sqlite3-insert-into-table-valuedictionary-goes-here
        https://stackoverflow.com/questions/16944372/insert-into-multiple-tables-sqlite
        """
        if "password" in kwargs.keys():
            kwargs["password"] = generate_password_hash(kwargs["password"])
        
        columns = ', '.join(kwargs.keys())
        placeholders = ', '.join('?' * len(kwargs))
        sql = 'INSERT INTO user ({}) VALUES ({})'.format(columns, placeholders)
        db = self.db

        db.execute(sql, tuple(kwargs.values()))

        db.commit()

    def find(self, **kwargs):
        import copy
        criteria = None
        value = None

        for k, v in kwargs.items():
            if not k == 'self' and not kwargs[k] is None:
                criteria = k
                value = v
                break
        
        return self.db.execute(
            "SELECT * FROM user " 
            "WHERE {} = ? ".format(criteria)
            , (value,)
        ).fetchone()

    def update(self, id = None, password=None):
        self.db.execute(
            "UPDATE user SET password = ? WHERE id = ?"
            , (password, id)
        )   
        self.db.commit()

class Cred_app(Base):
    __tablename__ = "cred_app"
    def insert(self,**kwargs):
        """https://stackoverflow.com/questions/14108162/python-sqlite3-insert-into-table-valuedictionary-goes-here
        """
        columns = ', '.join(kwargs.keys())
        placeholders = ', '.join('?' * len(kwargs))
        sql = 'INSERT INTO cred_app ({}) VALUES ({})'.format(columns, placeholders)
        db = self.db

        db.execute(sql, tuple(kwargs.values()))
        db.commit()

    def find(self, **kwargs):
        criteria = None
        value = None

        for k, v in kwargs.items():
            if not k == 'self' and not kwargs[k] is None:
                criteria = k
                value = v
                break
        
        return self.db.execute(
            "SELECT * FROM cred_app " 
            "WHERE {} = ? ".format(criteria)
            , (value,)
        ).fetchone()

    def update(self, redirect = None, user_id = None):
        self.db.execute(
            "UPDATE cred_app SET redirect = ? WHERE user_id = ?"
            , (redirect, user_id)
        )   
        self.db.commit()

class Cred_xero(Base):
    __tablename__ = "cred_xero"
    def find(self, **kwargs):
        criteria = None
        value = None

        for k, v in kwargs.items():
            if not k == 'self' and not kwargs[k] is None:
                criteria = k
                value = v
                break
        
        return self.db.execute(
            "SELECT * FROM cred_xero " 
            "WHERE {} = ? ".format(criteria)
            , (value,)
        ).fetchone()

    def insert(self,**kwargs):        
        columns = ', '.join(kwargs.keys())
        placeholders = ', '.join('?' * len(kwargs))
        sql = 'INSERT INTO cred_xero ({}) VALUES ({})'.format(columns, placeholders)
        db = self.db

        db.execute(sql, tuple(kwargs.values()))

        db.commit()

    def update(self, token_received = None, refresh_token = None, access_token = None, tenant_id = None, user_id = None):
        self.db.execute(
            "UPDATE cred_xero SET tenant_id = ?, token_received = ?, refresh_token = ?, access_token = ? WHERE user_id = ?"
            , (tenant_id,token_received, refresh_token, access_token, user_id)
        )   
        self.db.commit()

class Sage_xero_currency_mapping(Base):
    __tablename__ = 'sage_xero_currency_mapping'