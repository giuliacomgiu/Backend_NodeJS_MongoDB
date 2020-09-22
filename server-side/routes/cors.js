var cors = require('cors');

const whitelist = [process.env.APP_URI, process.env.APP_URI_SSL];

var corsRestrictOptions = (req, callback) => {
    var corsOptions;
    let origin = req.header('Origin');
    // !origin allows server-to-server cors
    if(whitelist.indexOf(origin) !== -1 || !origin) {
        corsOptions = { origin: true };
    }
    else {
        //corsOptions = { origin: false };
        var err = new Error('Forbidden by CORS');
        err.status = 403;
        err.type = 'CORS'
        err.name = 'Forbidden'
    }
    callback(err, corsOptions);
};

exports.cors = cors(); //All origins allowed
exports.restrict = cors(corsRestrictOptions); //Uses whitelist for HTTP requests.