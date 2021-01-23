// robinhood stuff
import Robinhood from 'robinhood';
import credentials from '../login.mjs';

let rh, initialized = false;

export default await new Promise((resolve, reject) => {

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
