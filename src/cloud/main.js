let apiKey = 'key-6d84442fc7f44c668cb5a9273b41af70';
let domain = 'auction.ucrpc.org';
let mailgun = require('mailgun-js')({apiKey: apiKey, domain: domain});

// Utility to get items unique to either array.
Array.prototype.diff = function(a) { // eslint-disable-line no-extend-native
  return this.filter(function(i) {
    return a.indexOf(i) < 0;
  });
};

// This code will be run before saving a new bid.
Parse.Cloud.beforeSave('NewBid', function(request, response) {
  currentBid = request.object;

  // Grab the item that is being bid on.
  itemQuery = new Parse.Query('Item');
  itemQuery.equalTo('objectId', request.object.get('item'));
  itemQuery.first({
    success: function(item) {
      if (!item) {
        return;
      }

      let date = Date.now();

      // Make sure bidding on this item hasn't closed.
      if (date > item.get('closetime')) {
        response.error('Bidding for this item has ended.');
        return;
      }

      // Make sure the bid isn't below the starting price.
      if (currentBid.get('maxBid') < item.get('price')) {
        response.error('Your bid needs to be higher than the item\'s starting '
                      +'price.');
        return;
      }

      // Make sure the bid increments by at least the minimum increment
      // Parse likes to return strings not numbers, hence the Number() function
      minIncrement = Number(item.get('priceIncrement'));
      if (!minIncrement) {
          minIncrement = 1;
      }
      if (Number(currentBid.get('maxBid')) < (Number(item.get('currentPrice'))
                                             + minIncrement )) {
        response.error('You need to raise the current price by at least $'
                      + minIncrement);
        return;
      }

      // Sanity check. In-house testing revealed that people love bidding
      // one trillion dollars.
      if (currentBid.get('maxBid') > 999999) {
        response.error('That is a stupendous amount of money. Remind me to '
                      +'apply for your job. Also, if you really did intend '
                      +'to bid that much, contact a moderator');
        return;
      }

      // Retrieve all previous bids on this item.
      query = new Parse.Query('NewBid');
      query.equalTo('item', request.object.get('item'));
      query.descending('maxBid', 'createdAt');
      query.limit = 1000; // Default is 100
      query.find({
        success: function(allWinningBids) {
          item.set('numberOfBids', allWinningBids.length + 1);

          let quantity = item.get('qty');
          let currentPrice = [];
          let currentWinners = [];
          let previousWinners = item.get('currentWinners');

          let allBidders = item.get('allBidders');
          if (!allBidders) {
            allBidders = [];
          }

          // Build an object mapping email addresses to their highest bids.
          let bidsForEmails = {};
          allWinningBids.forEach(function(bid) {
            let curBid = bidsForEmails[bid.get('email')];
            if (curBid) {
              bidsForEmails[bid.get('email')] =
                (curBid.get('maxBid') > bid.get('maxBid') ? curBid : bid);
            } else {
              bidsForEmails[bid.get('email')] = bid;
            }
          });

          // Get this bidder's last bid and make sure the new bid is an
          // increase.
          // If the new bid is higher, remove the old bid.
          let previousMaxBid = bidsForEmails[currentBid.get('email')];
          if (previousMaxBid) {
            if (Number(currentBid.get('maxBid')) <=
                Number(previousMaxBid.get('maxBid'))) {
              response.error('You already bid $' + previousMaxBid.get('maxBid')
                             + ' - you need to raise your bid!');
              return;
            } else {
              delete bidsForEmails[currentBid.get('email')];
            }
          }

          // Build an array of all the winning bids.
          allWinningBids = [];
          Object.keys(bidsForEmails).forEach(function(key, index) {
              allWinningBids.push(this[index]);
          }, bidsForEmails);

          // Add the new bid and sort by amount, secondarily sorting by time.
          allWinningBids.push(currentBid);
          allWinningBids = allWinningBids.sort(function(a, b) {
            let keyA = a.get('maxBid');
            let keyB = b.get('maxBid');

            // Sort on amount if they're different.
            if (keyA < keyB) {
              return 1;
            } else if (keyA > keyB) {
              return -1;
            }

            let dateKeyA = a.get('createdAt');
            let dateKeyB = b.get('createdAt');

            // Secondarily sort on time if the amounts are the same.
            if (dateKeyA < dateKeyB) {
              return 1;
            } else if (dateKeyA > dateKeyB) {
              return -1;
            }
            return 0;
          });

          // Slice off either the top n bids (for an item where the highest n
          // bids win) or all of them if there are fewer than n bids.
          let endIndex = 0;
          if (quantity > allWinningBids.length) {
            endIndex = allWinningBids.length;
          } else {
            endIndex = quantity;
          }

          let currentWinningBids = allWinningBids.slice(0, endIndex);

          // If the new bid is in the list of winning bids...
          if (currentWinningBids.indexOf(currentBid) != -1) {
            // Update the item's current price and current winners.
            for (let i = 0; (i < currentWinningBids.length); i++) {
              let bid = currentWinningBids[i];
              currentPrice.push(bid.get('maxBid'));
              currentWinners.push(bid.get('email'));
            }

            // Add this bidder to the list of all bidders...
            allBidders.push(currentBid.get('email'));

            // ...and remove them if they're already there.
            let uniqueArray = allBidders.filter(function(elem, pos) {
              return allBidders.indexOf(elem) == pos;
            });

            item.set('allBidders', uniqueArray);
            item.set('currentPrice', currentPrice);
            item.set('currentWinners', currentWinners);
            item.set('previousWinners', previousWinners);
            item.set('price', Math.max(...currentPrice));

            // Save all these updates back to the Item.
            item.save(null, {
              success: function(item) {
                response.success();
              },
              error: function(item, error) {
                console.error(error);
                response.error('Something went wrong - try again?');
              },
            }).fail(function(error) {
              console.error('Failure: ' + error.code + ' ' + error.message);
              response.error('Failure: ' + error.code + ' ' + error.message);
            });
          } else { // If it's not, someone else probably outbid you.
            response.error('Looks like you\'ve been outbid! Check the new '
                          +'price and try again.');
            return;
          }
        },
        error: function(error) {
          console.error('Error: ' + error.code + ' ' + error.message);
          response.error('Error: ' + error.code + ' ' + error.message);
        },
      }).fail(function(error) {
        console.error('Failure: ' + error.code + ' ' + error.message);
        response.error('Failure: ' + error.code + ' ' + error.message);
      });
    },
    error: function(error) {
        console.error('Error: ' + error.code + ' ' + error.message);
        response.error('Error: ' + error.code + ' ' + error.message);
    },
  }).fail(function(error) {
    console.error('Failure: ' + error.code + ' ' + error.message);
    response.error('Failure: ' + error.code + ' ' + error.message);
  });
});

// This code is run after the successful save of a new bid.
Parse.Cloud.afterSave('NewBid', function(request, response) {
  currentBid = request.object;

  // Get the item that's being bid on.
  itemQuery = new Parse.Query('Item');
  itemQuery.equalTo('objectId', request.object.get('item'));
  itemQuery.first({
    success: function(item) {
      let previousWinners = item.get('previousWinners');

      // For multi-quantity items, don't bother the people 'higher' than you
      // ex: don't send a push to the person with the #1 bid if someone
      // overtakes the #2 person.
      let index = previousWinners.indexOf(currentBid.get('email'));
      if (index > -1) {
        previousWinners.splice(index, 1);
      }

      // Grab installations where that user was previously a winner but no
      // longer is.
      let query = new Parse.Query(Parse.Installation);
      query.containedIn('email', previousWinners.diff(
        item.get('currentWinners'))
      );
      lastWinner = previousWinners.diff(item.get('currentWinners'))[0];

      // We'll refer to the bidder by their name if it's set...
      let identity = currentBid.get('name').split('@')[0];

      // ...and their email prefix (ex. jtsuji@hubspot.com -> jtsuji) if it's
      // not.
      if (identity.length < 3) {
        identity = currentBid.get('email').split('@')[0];
      }

      // Fire the push.
      let data = {
        from: 'Auction Master <auctionmaster@ucrpc.org>',
        to: lastWinner,
        subject: 'You have been outbid on ' + item.get('name'),
        text: 'It looks like someone else bid $' + currentBid.get('maxBid')
            + ' on ' + item.get('name') + ', which means you are no longer '
            + 'winning! Head back to the auction (https://auction.ucrpc.org/'
            + 'auction#' + item.id + ') to outbid them!',
      };

      mailgun.messages().send(data, function(error, body) {
        console.log('email sent to: ' + lastWinner);
      });
      Parse.Push.send({
        where: query,
        data: {
          // People like sassy apps.
          alert: 'Someone has outbid you by bidding $'
                 + currentBid.get('maxBid') + ' on ' + item.get('name')
                 + '. Surely you won\'t stand for this.',
          itemname: item.get('name'),
          personname: identity,
          itemid: item.id,
          sound: 'default',
          maxBid: currentBid.get('maxBid'),
          email: currentBid.get('email'),
        },
      }, {
        success: function() {
          console.log('Push Notification sent.');
        },
        error: function(error) {
          console.error('Push failed: ' +error);
        }, useMasterKey: true,
      });
    },
    error: function(error) {
        console.error('Push failed: ' +error);
    },
  });
});

// Sets up all the tables for you.
Parse.Cloud.job('InitializeForAuction', function(request, status) {
  Parse.Cloud.useMasterKey();

  // Add a test item.
  let Item = Parse.Object.extend('Item');
  let item = new Item();
  item.set('name', 'Test Object 7');
  item.set('description', 'This is a test object, and you (probably) won\'t be '
          +'asked to donate your bid on this item to charity. Who knows, '
          +'though.');
  item.set('donorname', 'Generous Donor');
  item.set('price', 50);
  item.set('priceIncrement', 1);
  item.set('imageurl', 'https://auction.ucrpc.com/TestObject7.jpg');
  item.set('qty', '1');
  item.set('fmv', '500');
  item.set('', '');
  item.set('currentPrice', []);
  item.set('numberOfBids', 0);
  item.set('allBidders', []);
  item.set('currentWinners', []);
  item.set('previousWinners', []);
  item.set('opentime', new Date('Dec 05, 2014, 05:00'));
  item.set('closetime', new Date('Dec 06, 2020, 05:00'));
  item.set('paidFor', false);
  item.save(null, {
    success: function(item) {
      let NewBid = Parse.Object.extend('NewBid');
      let bid = new NewBid();
      bid.set('item', '');
      bid.set('maxBid', 0);
      bid.set('email', '');
      bid.set('name', '');
      bid.save(null, {
        success: function(bid) {
          console.log('Initialization complete.');
        },
        error: function(bid) {
          console.log('Initialization complete.');
        },
      });
    },
    error: function(item, error) {
      console.error('Unable to initialize Item table. Have you set your '
                   +'application name, app ID, and master key in `.env`?');
    },
  });
});
