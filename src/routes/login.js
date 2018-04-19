let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// ROUTES
router.get('/login', function(req, res) {
  res.redirect('/#sign-in');
});

router.post('/login', function(req, res) {
  email = req.body.email;
  if (!email) {
    res.render('error.html', {
      title: 'Login Error',
      heading: 'Whoopsies! No Email.',
      msg: 'It looks like you forgot to put in an email address.',
    });
    return;
  }
  Parse.User.logIn(email, 'test', {
    success: function(user) {
      nextUrl = decodeURIComponent(res.body.nextUrl);
      if (nextUrl) {
        console.log('Heading to ' + nextUrl);
        res.redirect(nextUrl);
      } else {
        res.redirect('/auction');
      }
    },
    error: function(user, err) {
      if (err.code == 101) {
        user = new Parse.User();
        user.set('username', email);
        user.set('password', 'test');
        user.set('email', email);
        user.set('fullname', res.body.name);
        user.set('telephone', res.body.phone);

        user.signUp(null, {
          success: function(user) {
            // Have the user try logging in again
            res.redirect(307, req.originalUrl);
          },
          error: function(user, error) {
            res.render('error.html', {
              title: 'Signup Error',
              heading: 'Egads! A signup failure.',
              msg: 'When I went to record your info in our database, '
                 + 'something awful happened!',
              errors: [err],
            });
          },
        });
      }
      res.render('error.html', {
        title: 'Login Error',
        heading: 'Aw shucks, Login failed.',
        msg: 'I tried to pull up your account, but something happened.',
        errors: [err],
      });
    },
  });
});

module.exports = router;
