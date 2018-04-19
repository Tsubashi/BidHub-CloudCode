// ////////////////
// CONFIGURATION
console.log('Setting up Server...');
require('dotenv').config();
let express = require('express');
let bodyParser = require('body-parser');
let path = require('path');
let nunjucks = require('nunjucks');

let app = express();
if (process.env.NODE_ENV == 'Production') {
  nunjucks.configure('templates', {express: app});
} else {
  nunjucks.configure('templates', {watch: true, noCache: true, express: app});
}

// ////////////////
// ROUTES
app.use(bodyParser.urlencoded({extended: false}));

// ////////////////////////////////////////////////////////////////////////////
console.log('. Adding Static Routes');
app.use('/static', express.static(path.join(__dirname, '/static')));

// Root page gets special treatment
app.get('/', function(req, res) {
  res.render('index.html', {
    title: 'Home',
    nextUrl: req.query.nextUrl ? req.query.nextUrl : '',
  });
});

// ...so does the rules page
app.get('/rules.html', function(req, res) {
  res.render('rules.html', {
    title: 'Rules',
  });
});

// ////////////////////////////////////////////////////////////////////////////
console.log('. Adding Parse Routes');
app.use('/parse', require('./routes/parse.js'));

// ////////////////////////////////////////////////////////////////////////////
console.log('. Adding Login Middleware');
/**
 * @param {object} req Request
 * @param {object} res Response
 * @param {String} email The Email to use to log in
 * @param {Boolean} signUp A flag that sets whether a user is signed up if 
 *                         they do not already exist
 */
function doLogin(req, res, email, signUp=false) {
  Parse.User.logIn(email, 'test', {
    success: function(user) {
      nextUrl = decodeURIComponent(res.body.nextUrl);
      if (nextUrl) {
        res.redirect(nextUrl);
      } else {
        res.redirect('/auction');
      }
    },
    error: function(user, err) {
      console.log(err.code);
      if (signUp && err.code == 101) { // Invalid User
        // Signup and try again
        let user = new Parse.User();
        user.set('username', req.body.name);
        user.set('password', 'test');
        user.set('email', email);
        user.set('phone', req.body.phone);

        user.signUp(null, {
          success: function(user) {
            doLogin(req, res, email);
          },
          error: function(user, err) {
            res.render('error.html', {
              title: 'Signup Error',
              heading: 'Dagnabbit! Your Signup Failed.',
              msg: 'Since you are new, I tried to enter the info you gave me '
                 + 'to our database. Unfortunately, something went wrong',
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
}
app.post('/login', function(req, res) {
  email = req.body.email;
  if (!email) {
    res.render('error.html', {
      title: 'Login Error',
      heading: 'Whoopsies! No Email.',
      msg: 'It looks like you forgot to put in an email address.',
      errors: ['Could not read email field'],
    });
  }
  doLogin(req, res, email, true);
});

app.use(function(req, res, next) {
  let currentUser = Parse.User.current();
  // If the user is coming from the app, they will set the 'user' GET parameter.
  // Use this parameter to log them on here too.
  //
  // Yes, this is a sub-optimal hack, and should be replaced in future versions.
  // It exists because I had to ship the iOS app through App Store Reviews
  // before I really understood how Parse worked.
  // - cscott (18 April 2018)
  if (req.query.hasOwnProperty('user')) {
    doLogin(req, res, req.query.user);
  } else {
    if (currentUser) {
      next();
    } else {
      res.redirect('/?nextUrl=' + encodeURIComponent(req.originalUrl)
                  +'#sign_in');
    }
  }
});

// ////////////////////////////////////////////////////////////////////////////
console.log('. Adding Payment Routes');
app.use('/payment', require('./routes/braintree.js'));

// ////////////////////////////////////////////////////////////////////////////
console.log('. Adding Web Routes');
app.use('/auction', require('./routes/webapp.js'));

// ////////////////////////////////////////////////////////////////////////////
console.log('. Adding Error Pages'); // These must come last
app.use(function(req, res, next) {
  res.status(404).render('error.html', {
    title: 'Page Not Found',
    heading: 'What Page? Where?',
    msg: 'I cannot find the page you asked for. It is just not here!',
  });
});
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('error.html', {
    title: 'Error (500)',
    heading: 'Zoinks!',
    msg: 'If everything had gone right, you wouldn\'t be here, but '
       + 'It seems I made a mistake somewhere. I\'m '
       + 'dreadfully sorry, but could you go back and try it again?',
    errors: [err],
  });
});


// ////////////////
// RUN SERVER

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Server is running on port ' + port + '.');
});
