# -*- coding: utf-8 -*-
"""Simple script to populate auction database from CSV file."""

from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client['auction']
coll = db['Item']

total = 0
for item in coll.find():
    total += item["price"]
