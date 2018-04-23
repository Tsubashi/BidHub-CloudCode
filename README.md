# BidHub Cloud Code Backend
Backend code for HubSpot's open-source silent auction app. For an overview of the auction app project, [check out our blog post about it](http://dev.hubspot.com/blog/building-an-auction-app-in-a-weekend)!

The [iOS](https://github.com/HubSpot/BidHub-iOS) and [Android](https://github.com/HubSpot/BidHub-Android) auction apps are backed by [Parse](https://parse.com/), a popular and free backend-as-a-service. Parse handles the database, and also allows you to add server-side logic that occurs when an action is taken (such as a client posting a new bid). This repository contains all of that server-side logic, as well as this helpful README that'll get you set up with Parse.

## Developing

`docker run -it --rm --name bidhub --mount type=bind,target=/home/node/app,src=$(pwd)/src --network internal -p1337:1337 bidhub /bin/bash`

## Getting Started

TODO: Write this section

## Data Models
That's it! You're all set up, and you can go play with the [iOS](https://github.com/HubSpot/BidHub-iOS) and [Android](https://github.com/HubSpot/BidHub-Android) apps now. You can also grab the [Web Panel](https://github.com/HubSpot/BidHub-WebAdmin) to keep an eye on the auction. If you're interested in the data models, read on for a short description.

### Item

Represents a thing or service for sale. 

 * `allBidders` email addresses of everyone who has bid on this item
 * `closetime` after this time, bidding is closed
 * `currentPrice` current highest bid on this item (if qty > 1 and qty == n, highest n bids)
 * `currentWinners` email address of the current winner of this item (or n winners if qty > 1)
 * `description` long-form description of this item
 * `donorname` name of donor
 * `name` short(ish) name for this item
 * `numberOfBids` total number of bids for this item
 * `opentime` before this time, bidding is closed
 * `previousWinners` email address(es) of who was winning this item before the latest bid. Used by the server-side logic to send pushes only to people who are no longer winning an item.
 * `price` bids start at or above this price
 * `qty` how many of this item is available. For example, if 3 are available, the highest 3 bidders win.

### NewBid
Represents a single bid on an item. 

 * `amt` total dollar amount of bid
 * `email` Bidder's email (unique ID)
 * `item` objectId of item this bid is for
 * `name` Bidder's name
