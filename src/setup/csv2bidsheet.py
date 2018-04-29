# -*- coding: utf-8 -*-
"""Simple script to populate auction database from CSV file."""

import csv
from PIL import ImageFont, Image, ImageDraw
from slugify import slugify


def addText(img, where, size, text):
    font = ImageFont.truetype("HelveticaNeue.ttf", int(size))
    draw = ImageDraw.Draw(img)
    draw.text(where, text, fill=(0, 0, 0), font=font)
    del draw

    return img


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

        page = Image.new(
          mode="RGBA",
          size=(1275, 1650),
          color=(255, 255, 255, 0)
        )
        img = Image.open("page.png")
        addText(img, (550, 125), 40, name)
        addText(img, (550, 170), 25,
                "Minimum Bid Increment: ${}.00".format(inc))
        addText(img, (964, 250), 40, "${}.00".format(price))
        page.paste((0, 0, 0), (0, 0, 1275, 1650))
        page.paste(img, (0, 0))
        page.save("out/{}.png".format(image_name))
