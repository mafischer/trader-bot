import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

function getLogger(logDirectory) {
  const transport = [
    new DailyRotateFile({
      filename: path.resolve(logDirectory, 'error-%DATE%.log'),
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.resolve(logDirectory, 'info-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ];

  if (process.env.NODE_ENV !== 'production') {
    transport.push(
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple(),
        ),
      }),
    );
  }

  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      // wating on https://github.com/winstonjs/winston/issues/1724, see also https://github.com/winstonjs/logform/pull/106
      // format.errors({ stack: true }),
      format.splat(),
      format.json(),
    ),
    defaultMeta: { service: 'trader-bot' },
    transports: transport,
  });
}

export default getLogger;

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//

// ***************
// Allows for JSON logging
// ***************

// logger.log({
//   level: 'info',
//   message: 'Pass an object and this works',
//   additional: 'properties',
//   are: 'passed along',
// });

// logger.info({
//   message: 'Use a helper method if you want',
//   additional: 'properties',
//   are: 'passed along',
// });

// ***************
// Allows for parameter-based logging
// ***************

// logger.log('info', 'Pass a message and this works', {
//   additional: 'properties',
//   are: 'passed along',
// });

// logger.info('Use a helper method if you want', {
//   additional: 'properties',
//   are: 'passed along',
// });

// ***************
// Allows for string interpolation
// ***************

// info: test message my string {}
// logger.log('info', 'test message %s', 'my string');

// info: test message my 123 {}
// logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
// // logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });

// // prints "Found error at %s"
// logger.info('Found %s at %s', 'error', new Date());
// logger.info('Found %s at %s', 'error', new Error('chill winston'));
// logger.info('Found %s at %s', 'error', /WUT/);
// logger.info('Found %s at %s', 'error', true);
// logger.info('Found %s at %s', 'error', 100.00);
// logger.info('Found %s at %s', 'error', ['1, 2, 3']);

// ***************
// Allows for logging Error instances
// ***************

// logger.warn(new Error('Error passed as info'));
// logger.log('error', new Error('Error passed as message'));

// logger.warn('Maybe important error: ', new Error('Error passed as meta'));
// logger.log('error', 'Important error: ', new Error('Error passed as meta'));

// logger.error(new Error('Error as info'));
