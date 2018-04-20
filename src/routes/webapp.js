let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// ROUTES
router.get('/', function(req, res) {
  Parse.User.enableUnsafeCurrentUser();
  let user = Parse.User.current();
  let itemQuery = new Parse.Query('Item');
  itemQuery.find({
    success: function(list) {
      res.render('auction.html', {
        title: 'Main Auction',
        username: user.get('fullname'),
        items: items,
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
