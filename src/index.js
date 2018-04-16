
// ////////////////
// CONFIGURATION
console.log('Setting up Server...');
require('dotenv').config();
let express = require('express');
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

console.log('. Adding Static Routes');
app.use('/static', express.static(path.join(__dirname, '/static')));

// Root page gets special treatment
app.get('/', function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, '/static')});
});

console.log('. Adding Payment Routes');
app.use('/payment', require('./routes/braintree.js'));

console.log('. Adding Parse Routes');
app.use('/parse', require('./routes/parse.js'));

console.log('. Adding Web Routes');
app.use('/auction', require('./routes/webapp.js'));

// ////////////////
// RUN SERVER

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Server is running on port ' + port + '.');
});
