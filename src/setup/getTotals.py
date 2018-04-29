# -*- coding: utf-8 -*-
"""Simple script to populate auction database from CSV file."""

from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client['auction']
coll = db['Item']

total = 0
for item in coll.find():
    total += item["price"]

print("Total Earned: ${}".format(total))

users = []
for item in coll.find():
    for user in item["allBidders"]:
        users.extend(user)
print("Total bidders: {}".format(len(set(users))))
