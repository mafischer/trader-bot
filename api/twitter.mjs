import Twitter from 'twitter-v2';
import credentials from '../login.mjs';

// initialize the twitter client
export default new Twitter(credentials.twitter);

