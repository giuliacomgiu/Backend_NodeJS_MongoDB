var cors = require('cors');
var myErr = require('../error');
var { config } = require('../config');

const whitelist = [`${config.APP_URI}:${config.PORT}`, 
    `${config.APP_URI_SSL}:${config.PORT}`];

var corsRestrictOptions = (req, callback) => {
    var corsOptions;
    let origin = req.header('Origin');
    // !origin allows server-to-server cors
    if(whitelist.indexOf(origin) !== -1 || !origin) {
        corsOptions = { origin: true };
    }
    else {
        //corsOptions = { origin: false };
        var err = new myErr.CORSError();
    }
    callback(err, corsOptions);
};

exports.cors = cors(); //All origins allowed
exports.restrict = cors(corsRestrictOptions); //Uses whitelist for HTTP requests.