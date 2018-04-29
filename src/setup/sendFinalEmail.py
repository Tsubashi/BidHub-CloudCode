import requests
from pymongo import MongoClient

client = MongoClient('localhost', 27017)
db = client['auction']
coll = db['Item']

winners = {}

for item in coll.find():
    if(len(item["currentWinners"]) > 0):
        key = item["currentWinners"][0]
        if key not in winners:
            winners[key] = []
        winners[key].append((item["name"], item["price"]))

key = 'key-6d84442fc7f44c668cb5a9273b41af70'
to = '8th.realm@gmail.com'
for winner, item in winners.items():
    total = 0
    itemList = ''
    for name, price in item:
        itemList += ("<li>{} - ${}</li>".format(name, price))
        total += price

    request_url = 'https://api.mailgun.net/v2/auction.ucrpc.org/messages'
    request = requests.post(request_url, auth=('api', key), data={
        'from': 'Auction Master <contact@auction.ucrpc.org>',
        'to': to,
        'subject': 'Congratulations, you won!',
        'html': '<h1>Congratulations</h1>'
                '<p>Thank you for participating in the 2018 UCRPC silent auction. '
                'below, you will find a list of all the items that you have won.'
                '</p>'
                '<p>In order to pay for your items, find the moderator standing '
                'nearest your items and show them this email. They will help you '
                'use our <a href="https://www.paypal.com/donate/?token=2Ct87X5KY3G'
                'Q0KhXtxTQ2ud75MlL_gSIQ8o3FZ2iXKt3NQYUkbCTRejcjpD6OGy4JRBsRm&count'
                'ry.x=US&locale.x=US">donation page</a> to check out.</p>'
                '<h2 style="border-bottom: 1px solid black; text-align: center">'
                'Total</h2>'
                '<p style="text-align: center">{}</p>'
                '<ul>'
                '{}'
                '</ul>'
                '<p>Thank you for your participation</p>'.format(price,
                                                                 itemList),
    })
    print('Status: {}'.format(request.status_code))
    print('Body:   {}'.format(request.text))
