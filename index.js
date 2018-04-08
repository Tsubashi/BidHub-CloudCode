// Example express application adding the parse-server module to expose Parse
// compatible API routes.

let express = require('express');
let ParseServer = require('parse-server').ParseServer;
let path = require('path');
let braintree = require('braintree');

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

let paymentPrefix = '/payment';
let gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: '5zbdx785v9729wyt',
    publicKey: 'gbfn45btrnw526fk',
    privateKey: '44012e7e363864a6ac98db9038f89c05',
});

let api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'UCRPCAuction',
  masterKey: process.env.MASTER_KEY || 'bba0f20f-7d2a-48c5-bd91-a0061da55985',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  push: {
    android: {
      senderID: '976084462795',
      apiKey: 'AAAA40Mq7Ms:APA91bEWWBvZeh9K4GM3SliyQWQcrFOFU2PtH0ZYsxUJKY9B' +
              'Y0a8Z36DCPL-2LgJAaAtX4zY4gksd_wHFe6xlPt1flvCUnTQ2qQYsB6AeSBP' +
              '3LvfEf4kUFnnIpDhMBZ_sW1svCQ46I1D',
    },
    ios: {
      pfx: '/etc/parse/ucrpc_dev.p12',
      topic: 'com.aquaveo.UCRPCAuction',
      production: false,
    },
    ios: {
      pfx: '/etc/parse/ucrpc.p12',
      topic: 'com.aquaveo.UCRPCAuction',
      production: true,
    },
  },
});
// Client-keys like the javascript key or the .NET key are not necessary with
// parse-server. If you wish you require them, you can set them as options in
// the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

let app = express();

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
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
let mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.');
});

let port = process.env.PORT || 1337;
let httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});
