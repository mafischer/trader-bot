// robinhood stuff
const Robinhood = require('robinhood');
const credentials = require('../credentials');

let rh, initialized = false;

module.exports = new Promise((resolve, reject) => {

    if(initialized) {
        return resolve(rh);
    }

    rh = Robinhood(credentials.robinhood, function (err) {

        if(err) {
            reject(err);
        }
        initialized = true;
        resolve(rh);

    });
});
