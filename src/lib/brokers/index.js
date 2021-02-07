import robinhood from './robinhood/index';

export default async (log, settings) => ({
  robinhood: await robinhood(log, settings.robinhood),
});
