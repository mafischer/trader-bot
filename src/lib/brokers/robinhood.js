import Robinhood from 'robinhood';

export default (token) => (
  new Promise((resolve, reject) => {
    const rh = Robinhood(token, (err) => {
      if (err) {
        reject(err);
      }
      resolve(rh);
    });
  })
);
