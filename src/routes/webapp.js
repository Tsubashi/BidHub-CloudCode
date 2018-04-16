let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// SETUP

// ////////////////
// ROUTES
router.get('/checkout', function(req, res) {
  res.render('checkout.html', {
    totalPrice: 543,
    totalDue: 0,
  });
});

module.exports = router;
