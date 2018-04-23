let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap
let moment = require('moment');

// ////////////////
// ROUTES
router.get('/', function(req, res) {
  Parse.User.enableUnsafeCurrentUser();
  let user = Parse.User.current();
  let itemQuery = new Parse.Query('Item');
  itemQuery.find({
    success: function(list) {
      list.forEach(function(item, index, items) {
        opentime = item.get('opentime');
        closetime = item.get('closetime');
        items[index].isBiddable = false;
        if (moment(opentime).isAfter()) {
          items[index].timeMsg = 'Bidding opens in '
                               + moment(opentime).fromNow();
        } else if (moment(closetime).isAfter()) {
          items[index].timeMsg = 'Bidding closes in '
                               + moment(closetime).fromNow();
          items[index].isBiddable = true;
        } else {
          items[index].timeMsg = 'Bidding closed '
                               + moment(closetime).fromNow();
        }
      });
      res.render('auction.html', {
        title: 'Main Auction',
        username: user.get('fullname'),
        items: list,
      });
    },
    error: function(err) {
      res.render('error.html', {
        title: 'No Items!',
        heading: 'Awwwww, No items found!',
        msg: 'When I went to look for items, I could not find any! This could '
           + 'be a database issue, or a fluke. Try reloading the page, and if '
           + 'the problem persists, find an administrator and show them the '
           + 'following:',
        errors: err,
      });
    },
  });
});

router.get('/placeBid', function(req, res) {
  let itemId = req.query.id;
  if (!itemId) {
    res.status(422);
    res.send( 'It looks like you are missing the item ID, so I cannot '
            + 'tell which item you are bidding on. Please go back and '
            + 'try again');
    return;
  }
  itemId = decodeURIComponent(itemId);
  let itemQuery = new Parse.Query('Item');
  itemQuery.get(itemId, {
    success: function(item) {
      if (item) {
        price = item.get('price');
        inc = item.get('priceIncrement');
        res.render('bid.html', {
          bid1: price + inc,
          bid2: price + (inc * 2),
          bid5: price + (inc * 5),
          itemId: itemId,
        });
      } else {
        res.status(404).send('Item could not be found');
      }
    },
    error: function(error) {
        res.status(500).send('Query Failed');
    },
  });
});

router.post('/placeBid', function(req, res) {
  Parse.User.enableUnsafeCurrentUser();
  let user = Parse.User.current();
  let itemId = req.body.id;
  let bidAmount = req.body.bidAmount;
  if (!itemId || !bidAmount) {
    res.status(422).send('Your request is missing an item ID or bid amount.');
    return;
  }
  let NewBid = Parse.Object.extend('NewBid');
  let bid = new NewBid();
  bid.set('item', itemId);
  bid.set('maxBid', bidAmount);
  bid.set('email', user.get('email'));
  bid.set('name', user.get('fullname'));
  bid.save(null, {
    success: function(bid) {
      res.send('Congratulations, your bid is winning!');
    },
    error: function(bid) {
      res.status(403).send(err.message);
    },
  });
  res.send(req.body.bidAmount);
});

router.get('/checkout', function(req, res) {
  Parse.User.enableUnsafeCurrentUser();
  let user = Parse.User.current();
  if (!user) {
    res.render('error.html', {
      title: 'Authn Error',
      heading: 'Woah Nellie! You are not logged in!',
      msg: 'This is a very strange occurance that I cannot account for. You '
         + 'should not be able to be here without logging in, and yet here '
         + 'you are! You should try heading to the sign-in page and signing '
         + 'in again.',
      errors: ['User is ' + user],
    });
  }
  let email = user.get('email');
  let itemQuery = new Parse.Query('Item');
  itemQuery.equalTo('currentWinners', email);
  // TODO: itemQuery.greaterThan('closetime', now);

  itemQuery.find({
    success: function(itemsWon) {
      let itemList = [];
      let totalPrice = 0;
      let totalDue = 0;
      itemsWon.forEach(function(item) {
        totalPrice += item.get('price');
        let isPurchased = '';
        if (item.get('paidFor')) {
          isPurchased = '✔';
        } else {
          totalDue += item.get('price');
        }
        itemList.push([isPurchased,
                        item.get('name'),
                        item.get('price')]);
      });

      let title = 'Checkout';
      let txid = 0;
      if (req.query.hasOwnProperty('txid')) {
        txid = req.query.txid;
        title = 'Receipt';
      }
      res.render('checkout.html', {
        title: title,
        username: user.get('fullname'),
        txid: txid,
        total: totalDue,
        totalPrice: totalPrice,
        totalDue: totalDue,
        items: itemList,
      });
    },
    error: function(err) {
      res.render('error.html', {
        title: 'Query Error',
        heading: 'Blast, a Query Error!',
        msg: 'I tried to look through my item list to find what you won, but '
           + 'I had some trouble',
        errors: err,
      });
    },
  });
});

module.exports = router;
