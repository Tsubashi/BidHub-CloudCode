
// ////////////////
// CONFIGURATION
console.log('Setting up Parse Server');
require('dotenv').config();
let express = require('express');
let ParseServer = require('parse-server').ParseServer;
let path = require('path');
let braintree = require('braintree');


let paymentPrefix = '/payment';
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

let parseConfig = {
  databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'Auction',
  appName: process.env.APP_NAME || 'The Auction',
  publicServerURL: process.env.PUBLIC_SERVER_URL || 'https://localhost:1337',
  masterKey: process.env.MASTER_KEY || '',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  verifyUserEmails: true,
  emailAdapter: {
    module: '@parse/simple-mailgun-adapter',
    options: {
      apiKey: process.env.MAILGUN_API_KEY || '',
      domain: process.env.MAILGUN_DOMAIN || 'localhost',
      fromAddress: process.env.MAILGUN_FROM_ADDRESS || 'auctionmaster',
    },
  },
};
let pushConfig = {};
if (process.env.PUSH_ANDROID_ID) {
  pushConfig.android = {
    senderID: process.env.PUSH_ANDROID_ID,
    apiKey: process.env.PUSH_ANDROID_API_KEY || '',
  };
}
if (process.env.PUSH_IOS_PRODUCTION_KEY) {
  pushConfig.ios = {
    pfx: process.env.PUSH_IOS_PRODUCTION_KEY,
    topic: process.env.PUSH_IOS_TOPIC || 'com.example.Auction',
    production: (process.env.PUSH_IOS_MODE == 'Production'),
  };
};

parseConfig.push = pushConfig;
let api = new ParseServer(parseConfig);
let app = express();

// ////////////////
// ROUTES

// BrainTree Endpoints
app.get(paymentPrefix + '/client_token', function(req, res) {
  gateway.clientToken.generate({}, function(err, response) {
    res.send(response.clientToken);
  });
});

app.post(paymentPrefix + '/checkout', function(req, res) {
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

// Serve static assets from the /public folder
app.use('/static', express.static(path.join(__dirname, '/static')));

// Serve the Parse API on the /parse URL prefix
let mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, '/static')});
});

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});
