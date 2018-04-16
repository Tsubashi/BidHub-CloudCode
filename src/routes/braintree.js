let braintree = require('braintree');
let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// SETUP
let braintreeMode = braintree.Environment.Production;
if (process.env.BRAINTREE_MODE != 'Production') {
  braintreeMode = braintree.Environment.Sandbox;
}

let gateway = braintree.connect({
    environment: braintreeMode,
    merchantId: process.env.BRAINTREE_ID || '',
    publicKey: process.env.BRAINTREE_PUBLIC_KEY || '',
    privateKey: process.env.BRAINTREE_PRIVATE_KEY || '',
});

// ////////////////
// ROUTES
router.get('/client_token', function(req, res) {
  gateway.clientToken.generate({}, function(err, response) {
    res.send(response.clientToken);
  });
});

router.get('/checkout', function(req, res) {
  let error = {
    code: -2,
    message: 'No Payment Data',
  };
  res.render('error.html', {
    title: 'Error',
    heading: 'Wait a second...',
    msg: 'It looks like you came here without any payment data. This can '
       + 'happen if you manually navigate to this page, rather that get '
       + 'here by submitting the form. Head back to the payment page to '
       + 'enter your payment details.',
    errors: error,
  });
});

router.post('/checkout', function(req, res) {
  let clientNonce = req.body.payment_method_nonce;
  gateway.transaction.sale({
    amount: '10.00',
    paymentMethodNonce: clientNonce,
    options: {
      submitForSettlement: true,
    },
  }, function(err, result) {
    if (result.success || result.transaction) {
      res.redirect('/auction/checkout?txid=' + result.transaction.id);
    } else {
      transactionErrors = result.errors.deepErrors();
      res.render('error.html', {
        title: 'Transaction Error',
        heading: 'Woah There!',
        msg: 'Something has gone terribly wrong in processing your payment.',
        errors: transactionErrors,
      });
    }
  });
});

module.exports = router;
