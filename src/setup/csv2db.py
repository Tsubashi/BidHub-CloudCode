# -*- coding: utf-8 -*-
"""Simple script to populate auction database from CSV file."""

import csv
import dateutil.parser
import string
import random
from datetime import datetime
from slugify import slugify
from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client['auction']
coll = db['Item']

with open('UCRPC_Item_List.csv', 'r', encoding='utf-8') as f:
    items = csv.reader(f, delimiter=",", quotechar='"')
    itemList = []
    for item in items:
        name = item[1]
        image_name = slugify(name)
        FMV = item[2]
        price = int(item[3].replace('$', ''))
        inc = int(item[4].replace('$', ''))
        donor = item[5]
        desc = item[6]
        itemEntry = {
             "_id": ''.join(random.choices(
               string.ascii_uppercase + string.digits, k=10)),
             "currentPrice": [],
             "allBidders": [],
             "currentWinners": [],
             "previousWinners": [],
             "opentime": dateutil.parser.parse("2018-04-28T16:00:00.000Z"),
             "closetime": dateutil.parser.parse("2018-04-28T21:00:00.000Z"),
             "name": name,
             "description": desc,
             "donorname": donor,
             "price": price,
             "priceIncrement": inc,
             "imageurl": "https://ucrpc.aquaveo.com/static/images/{}.jpg"
                         .format(image_name),
             "qty": "1",
             "fmv": FMV,
             "paidFor": False,
             "numberOfBids": 0,
             "_created_at": datetime.now(),
             "_updated_at": datetime.now()
        }
        coll.insert_one(itemEntry)
