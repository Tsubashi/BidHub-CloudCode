
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

console.log('. Adding Static Routes');
app.use('/static', express.static(path.join(__dirname, '/static')));

// Root page gets special treatment
app.get('/', function(req, res) {
  res.render('index.html', {title: 'Home'});
});

console.log('. Adding Payment Routes');
app.use('/payment', require('./routes/braintree.js'));

console.log('. Adding Parse Routes');
app.use('/parse', require('./routes/parse.js'));

console.log('. Adding Web Routes');
app.use('/auction', require('./routes/webapp.js'));

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
  });
});


// ////////////////
// RUN SERVER

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Server is running on port ' + port + '.');
});
