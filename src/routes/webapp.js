let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// SETUP

// ////////////////
// ROUTES
router.get('/checkout', function(req, res) {
  let title = 'Checkout';
  let txid = 0;
  if (req.query.hasOwnProperty('txid')) {
    txid = req.query.txid;
    title = 'Receipt';
  }
  res.render('checkout.html', {
    title: title,
    txid: txid,
    totalPrice: 543,
    totalDue: 43,
    items: [['✔', 'Test Object 7', 500], ['', 'Test Object 6', 43]],
  });
});

module.exports = router;
