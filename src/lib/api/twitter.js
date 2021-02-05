import Twitter from 'twitter-v2';

// initialize the twitter client
export default (config) => (new Twitter(config));
