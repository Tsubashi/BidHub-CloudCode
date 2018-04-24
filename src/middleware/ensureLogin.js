/**
 * Make sure the user is logged in before proceeding to the next route
 * @param {Object} req Object representing the user request
 * @param {Object} res Object representing the server's response
 * @param {Function} next Function to call to pass processing on to the next
 *                        route
 */
function ensureLogin(req, res, next) {
  // If the user is coming from the app, they will set the 'user' GET parameter.
  // Use this parameter to log them on here too.
  //
  // Yes, this is a sub-optimal hack, and should be replaced in future versions.
  // It exists because I had to ship the iOS app through App Store Reviews
  // before I really understood how Parse worked.
  // - cscott (18 April 2018)
  if (req.query.hasOwnProperty('user')) {
    Parse.User.logIn(req.query.user, 'test', {
      success: function(user) {
        req.session.token = user.getSessionToken();
        next();
      },
      error: function(user, err) {
        res.render('error.html', {
          title: 'Login Error',
          heading: 'Dagnabbit, handoff failed.',
          msg: 'It looks like you are coming from the app, but your '
             + 'credentials are wrong. This could happen if you manually '
             + 'entered or changed the URL.',
          errors: [err],
        });
      },
    });
  } else {
    if (!req.session || !req.session.token) { // Not logged in
      res.redirect('/user/login?nextUrl=' + encodeURIComponent(req.originalUrl)
                  );
      return;
    }

    Parse.Cloud.httpRequest({
      url: Parse.serverURL + '/users/me',
      headers: {
        'X-Parse-Application-Id': process.env.APP_ID,
        'X-Parse-Session-Token': req.session.token,
      },
    }).then(function(userData) {
      req.user = Parse.Object.fromJSON(userData.data);
      next();
    }, function(error) {
      res.redirect('/user/login?nextUrl=' + encodeURIComponent(req.originalUrl)
                  );
      return;
    });
  }
}

module.exports = ensureLogin;
