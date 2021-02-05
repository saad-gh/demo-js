import pyodbc
from datetime import datetime
import pytz
from flask import g, current_app
import pandas as pd
import os

class Base(object):
    server=""
    database=""
    username=""
    password=""
    __tablename__ = None
    __join__ = None

    def __init__(self):
        """Connect to the application's configured database. The connection
        is unique for each request and will be reused if this is called
        again.
        """
        self.server = "123.176.4.27,65001"
        self.database = "TESTDVCDAT_30072020"
        self.username = os.getenv('SAGE_DB_USER')
        self.password = os.getenv('SAGE_DB_PASS')

        # https://docs.microsoft.com/en-us/sql/connect/python/pyodbc/step-3-proof-of-concept-connecting-to-sql-using-pyodbc?view=sql-server-ver15
        if "db_sage" not in g:
            g.db_sage = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};'
                      'SERVER=' + self.server + ';' +
                      'DATABASE=' + self.database + ';' +
                      'UID=' + self.username + ';' +
                      'PWD=' + self.password
                      )

        self.db = g.db_sage

    def test_cxn(self):
        #Sample select query
        cursor = self.db.cursor()
        cursor.execute("SELECT * FROM INFORMATION_SCHEMA.TABLES;") 
        row = cursor.fetchone() 
        while row: 
            print(row[2])
            row = cursor.fetchone()
    
    def save_csv(self, **kwargs):
        pass
    
    def find(self, **kwargs):
        if self.__tablename__ == None:
            raise NotImplementedError
        fields = kwargs['fields']
        filter = kwargs['filter']
        sql = f"SELECT {fields if fields else '*'} FROM {self.__tablename__} {('WHERE ' + filter) if filter else ''};"
        return pd.read_sql(sql,self.db)

    def find_join(self,**kwargs):
        if self.__tablename__ == None or self.__join__ == None:
            raise NotImplementedError

        fields = kwargs.pop('fields',None)
        filter = kwargs.pop('filter',None)
        save = kwargs.pop('save', None)

        sql = (
            f"SELECT {fields if fields else '*'} "
            f"FROM {self.__tablename__} {self.__tablename__} INNER JOIN {self.__join__.__tablename__} {self.__join__.__tablename__} "
            f"ON {self.__tablename__}.{self.__join__.__foriegnkey__} = {self.__join__.__tablename__}.{self.__join__.__foriegnkey__} "
            f"{('WHERE ' + filter) if filter else ''};"
        )

        data = pd.read_sql(sql,self.db)
        self.__time__ = datetime.strftime(datetime.now(pytz.timezone("Asia/Singapore")),"%y%m%d%H%M")
        if save:
            data.to_csv(os.path.join(current_app.instance_path,'data',(
                f'{self.__tablename__}_{self.__join__.__tablename__}_'
                f'{self.__time__}.csv'
            )),index=False)
        return data

    def find_distinct(self, fields):
        if self.__tablename__ is None:
            raise NotImplementedError
        
        f = ','.join(fields)
        sql = f'SELECT DISTINCT {f} FROM {self.__tablename__}'
        return pd.read_sql(sql,self.db)

# Purchase
class ICITEM(Base):
    __tablename__ = "ICITEM" 
class PORCPL(Base):
    __tablename__ = "PORCPL"
    __foriegnkey__ = "RCPHSEQ"
    __join__ = ICITEM
    __on__ = 'ICITEM.ITEMNO = CONCAT(SUBSTRING(PORCPL.ITEMNO,1,4),SUBSTRING(PORCPL.ITEMNO,6,6),SUBSTRING(PORCPL.ITEMNO,13,5),SUBSTRING(PORCPL.ITEMNO,19,2))'
class PORCPH1(Base):
    __tablename__ = "PORCPH1"
    __join__ = PORCPL

    def find_join(self, **kwargs):
        fields = kwargs.pop('fields',None)
        filter = kwargs.pop('filter',None)
        t = PORCPL

        sql = (
            f"SELECT {fields if fields else '*'} "
            f"FROM {self.__tablename__} {self.__tablename__} JOIN {self.__join__.__tablename__} {self.__join__.__tablename__} "
            f"ON {self.__tablename__}.{self.__join__.__foriegnkey__} = {self.__join__.__tablename__}.{self.__join__.__foriegnkey__} "
            f"JOIN {t.__join__.__tablename__} {t.__join__.__tablename__} ON {t.__on__} "
            f"{('WHERE ' + filter) if filter else ''};"
        )
        
        return pd.read_sql(sql,self.db)


# Sale
class OEINVD(Base):
    __tablename__ = "OEINVD"
    __foriegnkey__ = "INVUNIQ"
    # __join__ = ICITEM
    # __on__ = 'ICITEM.ITEMNO = CONCAT(SUBSTRING(OEINVD.ITEM,1,4),SUBSTRING(OEINVD.ITEM,6,6),SUBSTRING(OEINVD.ITEM,13,5),SUBSTRING(OEINVD.ITEM,19,2))'
class OEINVH(Base):
    __tablename__ = "OEINVH"
    __join__ = OEINVD

    # def find_join(self, **kwargs):
    #     fields = kwargs.pop('fields',None)
    #     filter = kwargs.pop('filter',None)
    #     t = OEINVD

    #     sql = (
    #         f"SELECT {fields if fields else '*'} "
    #         f"FROM {self.__tablename__} {self.__tablename__} JOIN {self.__join__.__tablename__} {self.__join__.__tablename__} "
    #         f"ON {self.__tablename__}.{self.__join__.__foriegnkey__} = {self.__join__.__tablename__}.{self.__join__.__foriegnkey__} "
    #         f"JOIN {t.__join__.__tablename__} {t.__join__.__tablename__} ON {t.__on__} "
    #         f"{('WHERE ' + filter) if filter else ''};"
    #     )
        
    #     return pd.read_sql(sql,self.db)

# Credit Notes
class OECRDD(Base):
    __tablename__ = "OECRDD"
    __foriegnkey__ = "CRDUNIQ"
class OECRDH(Base):
    __tablename__ = "OECRDH"
    __join__ = OECRDD

# sql = 'SELECT ICITEM.ITEMNO, ICITEM.[DESC] FROM PORCPL PORCPL JOIN PORCPH1 PORCPH1 ON PORCPL.RCPHSEQ = PORCPH1.RCPHSEQ JOIN ICITEM ICITEM ON ICITEM.ITEMNO = CONCAT(SUBSTRING(PORCPL.ITEMNO,1,4),SUBSTRING(PORCPL.ITEMNO,6,6),SUBSTRING(PORCPL.ITEMNO,13,5),SUBSTRING(PORCPL.ITEMNO,19,2))  WHERE PORCPH1.[DATE] >= 20200101 and PORCPH1.[DATE] <= 20200131'