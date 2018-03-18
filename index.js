// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'UCRPCAuction',
  masterKey: process.env.MASTER_KEY || 'bba0f20f-7d2a-48c5-bd91-a0061da55985', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  push: {
    android: {
      senderID: '976084462795',
      apiKey: 'AAAA40Mq7Ms:APA91bEWWBvZeh9K4GM3SliyQWQcrFOFU2PtH0ZYsxUJKY9BY0a8Z36DCPL-2LgJAaAtX4zY4gksd_wHFe6xlPt1flvCUnTQ2qQYsB6AeSBP3LvfEf4kUFnnIpDhMBZ_sW1svCQ46I1D'
    },
    ios: {
      pfx: '/etc/parse/ucrpc_dev.p12',
      topic: 'com.aquaveo.UCRPCAuction',
      production: false
    },
    ios: {
      pfx: '/etc/parse/ucrpc.p12',
      topic: 'com.aquaveo.UCRPCAuction',
      production: true
    }
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.');
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
