let braintree = require('braintree');
let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

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

router.get('/client_token', function(req, res) {
  gateway.clientToken.generate({}, function(err, response) {
    res.send(response.clientToken);
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
    // TODO: Handle Errors
  });
});

module.exports = router;
