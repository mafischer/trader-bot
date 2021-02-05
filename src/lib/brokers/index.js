import robinhood from './robinhood';

export default async (settings) => ({
  robinhood: await robinhood(settings.robinhood),
});
