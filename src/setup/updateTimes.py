# -*- coding: utf-8 -*-
"""Simple script to populate auction database from CSV file."""

import dateutil.parser
from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client['auction']
coll = db['Item']

for item in coll.find():
    coll.update({'_id': item['_id']},
                {"$set":
                 {'closetime':
                  dateutil.parser.parse("2018-04-29T03:15:00.000Z")
                  }
                 }
                )
    print(item['_id'])
