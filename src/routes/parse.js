let ParseServer = require('parse-server').ParseServer;

let parseConfig = {
  databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev',
  cloud: __dirname + '/../cloud/main.js',
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

module.exports = api;
