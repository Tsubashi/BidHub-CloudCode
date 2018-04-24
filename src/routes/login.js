let express = require('express');
let router = express.Router(); // eslint-disable-line new-cap

// ////////////////
// ROUTES
router.get('/logout', function(req, res) {
  Parse.User.logOut().then(() => {
    res.redirect('/');
  });
});

router.get('/login', function(req, res) {
  errorMsg = encodeURIComponent('You are not logged in!');
  res.redirect('/?nextUrl=' + req.query.nextUrl + '&error=' + errorMsg
              + '#sign_in_form');
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
      req.session.token = user.getSessionToken();
      nextUrl = decodeURIComponent(req.body.nextUrl);
      if (nextUrl) {
        res.redirect(nextUrl);
      } else {
        res.redirect('/auction');
      }
    },
    error: function(user, err) {
      if (err.code == 101) {
        let user = new Parse.User();
        user.set('username', email);
        user.set('password', 'test');
        user.set('email', email);
        user.set('fullname', req.body.name);
        user.set('telephone', req.body.phone);

        user.signUp(null, {
          success: function(user) {
            // Have the user try logging in again
            res.redirect(307, req.originalUrl);
            return;
          },
          error: function(user, error) {
            res.render('error.html', {
              title: 'Signup Error',
              heading: 'Egads! A signup failure.',
              msg: 'When I went to record your info in our database, '
                 + 'something awful happened!',
              errors: [err],
            });
            return;
          },
        });
      } else {
        res.render('error.html', {
          title: 'Login Error',
          heading: 'Aw shucks, Login failed.',
          msg: 'I tried to pull up your account, but something happened.',
          errors: [err],
        });
      }
    },
  });
});

router.get('/login_status', function(req, res) {
  if (!req.session || !req.session.token) { // Not logged in
    res.status(403).send('Not Logged In');
    return;
  }

  Parse.Cloud.httpRequest({
    url: Parse.serverURL + '/users/me',
    headers: {
      'X-Parse-Application-Id': process.env.APP_ID,
      'X-Parse-Session-Token': req.session.token,
    },
  }).then(function(userData) {
    res.status(200).send('Logged In');
    return;
  }, function(error) {
    res.status(403).send('Not Logged In');
    return;
  });
});

router.get('/email-verified', function(req, res) {
  res.render('email-verified.html');
});

module.exports = router;
