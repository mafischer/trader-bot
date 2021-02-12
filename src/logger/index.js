import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

function getLogger(logDirectory) {
  const transport = [
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
    level: 'silly',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
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
