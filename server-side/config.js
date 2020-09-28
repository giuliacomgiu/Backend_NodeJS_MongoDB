class Config{
  #PORT;
  #MONGO_URI;
  #APP_URI;
  #APP_URI_SSL;
  #SECRET_KEY;
  #FACEBOOK_APP_ID;
  #FACEBOOK_APP_SECRET;
  #GOOGLE_CLIENT_ID;
  #GOOGLE_CLIENT_SECRET;
  constructor(){
    this.#PORT = process.env.PORT;
    this.#MONGO_URI = process.env.MONGO_URI;
    this.#APP_URI = process.env.APP_URI;
    this.#APP_URI_SSL = process.env.APP_URI_SSL;
    this.#SECRET_KEY = process.env.SECRET_KEY;
    this.#FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
    this.#FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    this.#GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    this.#GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  }

  get PORT() { return this.#PORT }
  get MONGO_URI() { return this.#MONGO_URI }
  get APP_URI() { return this.#APP_URI }
  get APP_URI_SSL() { return this.#APP_URI_SSL }
  get SECRET_KEY() { return this.#SECRET_KEY }
  get FACEBOOK_APP_ID() { return this.#FACEBOOK_APP_ID }
  get FACEBOOK_APP_SECRET() { return this.#FACEBOOK_APP_SECRET }
  get GOOGLE_CLIENT_ID() { return this.#GOOGLE_CLIENT_ID }
  get GOOGLE_CLIENT_SECRET() { return this.#GOOGLE_CLIENT_SECRET }

  setConfig(myConfig){
    this.#PORT = myConfig.PORT || process.env.PORT;
    this.#MONGO_URI = myConfig.MONGO_URI || process.env.MONGO_URI;
    this.#APP_URI = myConfig.APP_URI || process.env.APP_URI;
    this.#APP_URI_SSL = myConfig.APP_URI_SSL || process.env.APP_URI_SSL;
    this.#SECRET_KEY = myConfig.SECRET_KEY || process.env.SECRET_KEY;
    this.#FACEBOOK_APP_ID = myConfig.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
    this.#FACEBOOK_APP_SECRET = myConfig.FACEBOOK_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
    this.#GOOGLE_CLIENT_ID = myConfig.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    this.#GOOGLE_CLIENT_SECRET = myConfig.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  }
}

var config = new Config();

// Getting secret info from AWS
async function awsStart(){
  var AWS = require('aws-sdk'),
  region = "sa-east-1",
  secretName = "myKeys",
  secret,
  decodedBinarySecret;
  
  // Create a Secrets Manager client
  var client = new AWS.SecretsManager({
    region: region
  });
  return new Promise((resolve, reject) => {  
    client.getSecretValue({SecretId: secretName}, function(err, data) {
    if (err) { 
      console.log('rejected')
      reject(err) 
    }
    else {
      // Decrypts secret using the associated KMS CMK.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      if ('SecretString' in data) {
        config.setConfig(JSON.parse(data.SecretString))
        resolve();
      } else {
        let buff = new Buffer(data.SecretBinary, 'base64');
        config.setConfig(JSON.parse(buff.toString('ascii')));
        resolve();
      };
    };
    });
  });
};

module.exports = {
  awsStart:awsStart,
  config:config,
}