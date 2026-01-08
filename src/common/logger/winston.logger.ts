import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';


export class WinstonLogger implements LoggerService {
    private logger: winston.Logger;


    constructor(level = 'info') {
        const transport = new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
        });


        this.logger = winston.createLogger({
            level,
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json(),
            ),
            transports: [transport, new winston.transports.Console()],
            exitOnError: false,
        });
    }


    log(message: string, meta: any = {}) {
        this.logger.info(message, meta);
    }
    error(message: string, trace?: string, meta: any = {}) {
        this.logger.error(message, { trace, ...meta });
    }
    warn(message: string, meta: any = {}) {
        this.logger.warn(message, meta);
    }
    debug(message: string, meta: any = {}) {
        this.logger.debug(message, meta);
    }
    verbose(message: string, meta: any = {}) {
        this.logger.verbose(message, meta);
    }
}