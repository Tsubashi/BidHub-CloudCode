let braintree = require('braintree');
let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap
let moment = require('moment');

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
    if (err) {
        res.send(500);
    } else {
        res.send(response.clientToken);
    }
  });
});

router.get('/checkout', function(req, res) {
  res.render('error.html', {
    title: 'No Payment Data',
    heading: 'Wait a second...',
    msg: 'It looks like you came here without any payment data. This can '
       + 'happen if you manually navigate to this page, rather that get '
       + 'here by submitting the form. Head back to the payment page to '
       + 'enter your payment details.',
  });
});

router.post('/checkout', function(req, res) {
  user = req.user;
  let email = user.get('email');
  let clientNonce = req.body.payment_method_nonce;
  let itemQuery = new Parse.Query('Item');
  itemQuery.equalTo('currentWinners', email);

  itemQuery.find({
    success: function(itemsWon) {
      let totalDue = 0;
      itemsWon.forEach(function(item) {
        if (moment(item.get('closetime')).isAfter()) {
          return;
        }
        if (!item.get('paidFor')) {
          totalDue += item.get('price');
        }
      });

      if (totalDue != req.body.total) {
        res.render('error.html', {
          title: 'Mismatched Total',
          heading: 'That doesn\'t look right...',
          msg: 'The total amount due changed between this page and the last. '
             + 'Maybe you won another item? Go back to the payment page to '
             + 'check.',
          errors: ['Total amount charged: ' + totalDue,
                   'Total expected: ' + req.body.total,
                  ],
        });
      }

      gateway.transaction.sale({
        amount: totalDue,
        paymentMethodNonce: clientNonce,
        options: {
          submitForSettlement: true,
        },
      }, function(err, result) {
        if (result.success || result.transaction) {
          let itemQuery = new Parse.Query('Item');
          itemQuery.equalTo('currentWinners', email);

          let failures = [];
          itemQuery.find({
            success: function(items) {
              items.forEach(function(item) {
                item.set('paidFor', true);
                item.save(null, {
                  success: function(item) {
                    // Not sure what to do here
                  },
                }).fail(function(err) {
                  // log failure?
                  failures.push(item.get('name'));
                });
              });
            },
          }).fail(function(err) {
             res.render('error.html', {
                 title: 'Recording Error',
                 heading: 'This is bad. DO NOT RELOAD.',
                 msg: 'I was able to process your payment correctly, but '
                    + 'something went wrong when I tried to record it in '
                    + 'our database. DO NOT attempt to check out again. '
                    + 'If you do, it will charge you twice. Your transaction '
                    + 'ID is ' + result.transaction.id + '. Please show this '
                    + 'page to a moderator and have them manually record this '
                    + 'transaction.',
                 errors: [err],
             });
          });
          if (failures.length > 0) {
            res.render('error.html', {
                 title: 'Recording Error',
                 heading: 'This is bad. DO NOT RELOAD.',
                 msg: 'I was able to process your payment correctly, but '
                    + 'something went wrong when I tried to record it in '
                    + 'our database. DO NOT attempt to check out again. '
                    + 'If you do, it will charge you twice. Your transaction '
                    + 'ID is ' + result.transaction.id + '. Please show this '
                    + 'page to a moderator and have them manually record this '
                    + 'transaction.',
                 errors: [failures],
            });
            return;
          }
          res.redirect('/auction/checkout?txid=' + result.transaction.id);
        } else {
          transactionErrors = result.errors.deepErrors();
          res.render('error.html', {
            title: 'Transaction Error',
            heading: 'Woah There!',
            msg: 'Something has gone terribly wrong in processing your '
               + 'payment.',
            errors: transactionErrors,
          });
        }
      });
    },
  }).fail(function(err) {
   res.render('error.html', {
      title: 'Checkout Failure',
      heading: 'Well, this is embarrasing',
      msg: 'I botched the actual checkout part. I am afraid I will need to '
         + 'ask you to do it all over again.',
      errors: [err],
    });
  });
});

module.exports = router;
