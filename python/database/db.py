# DB abstraction layer inspired by https://developer.okta.com/blog/2018/12/20/crud-app-with-python-flask-react
from flask import g

class DB(object):
    def __init__(self, adapter=None):
        self.client = adapter()
    
    def init(self):
        self.client.init()
    
    def insert(self,**kwargs):
        self.client.insert(**kwargs)

    def insert_2(self,**kwargs):
        self.client.insert_2(**kwargs)

    def update_2(self,**kwargs):
        self.client.update_2(**kwargs)

    def find_2(self,**kwargs):
        return self.client.find_2(**kwargs)

    def find(self,**kwargs):
        return self.client.find(**kwargs)
    
    def find_one(self):
        return self.client.find_one()
    
    def find_join(self,**kwargs):
        return self.client.find_join(**kwargs)

    def update(self,**kwargs):
        self.client.update(**kwargs)
    
    def find_distinct(self,fields):
        return self.client.find_distinct(fields)
    
    def getconnection(self):
        return self.client.getconnection()

    @staticmethod
    def close_db(key=None):
        def close(self):
            db = g.pop(key,None)
            
            if db is not None:
                db.close()
        return close