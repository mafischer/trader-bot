import Twitter from './twitter';

export default async (settings) => ({
  twitter: await Twitter(settings.twitter),
});
