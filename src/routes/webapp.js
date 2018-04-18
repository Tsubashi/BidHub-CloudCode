let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// SETUP

/**
 * @param {Array} itemsWon List of item objects which have closed and been
 *                         won by the current user.
 */
function checkout_onQuerySuccess(itemsWon) { // eslint-disable-line camelcase
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
    txid: txid,
    total: totalDue,
    totalPrice: totalPrice,
    totalDue: totalDue,
    items: itemList,
  });
}

// ////////////////
// ROUTES
router.get('/checkout', function(req, res) {
  let email = Parse.User.current().get('email');
  let itemQuery = new Parse.Query('Item');
  itemQuery.equalTo('currentWinners', email);
  // itemQuery.greaterThan('closetime', now);

  itemQuery.find({
    success: checkout_onQuerySuccess(itemsWon),
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
