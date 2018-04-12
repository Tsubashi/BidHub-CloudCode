
// ////////////////
// CONFIGURATION
console.log('Setting up Server...');
require('dotenv').config();
let express = require('express');
let path = require('path');
let app = express();

// ////////////////
// ROUTES

console.log('. Adding Static Routes');
// Serve static assets from the /static folder
app.use('/static', express.static(path.join(__dirname, '/static')));

// Root page gets special treatment
app.get('/', function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, '/static')});
});

console.log('. Adding Payment Routes');
// Add Braintree Routes to the /payment prefix
app.use('/payment', require('./routes/braintree.js'));

console.log('. Adding Parse Routes');
// Serve the Parse API on the /parse URL prefix
app.use('/parse', require('./routes/parse.js'));

// ////////////////
// RUN SERVER

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Server is running on port ' + port + '.');
});
