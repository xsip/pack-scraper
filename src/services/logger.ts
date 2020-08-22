import * as winston from 'winston';

export class Logger {

    private static _instance: any;

    public static get = (className: string = '') => {
        if (!Logger._instance) {
            Logger.createInstance();
        }
        return {
            info: (message: any) => Logger._instance.info(`[${className}] ${message}`),
            info_raw: (message: any) => Logger._instance.info(`${message}`),
            warn: (message: any) => Logger._instance.warn(`[${className}] ${message}`),
            error: (message: any, error: any) => Logger._instance.error(
                `[${className}] ${message}${error && error.stack ? error.stack : (error || '')}`),
            stopLogging: () => {
                Logger._instance.silent = true
            }
        };
    };

    private static createInstance = () => {
        Logger._instance = winston.createLogger({
            format: winston.format.combine(
                winston.format.splat(),
                winston.format.simple(),
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.printf((info: any) => `pack-scraper: ${info.timestamp} ${info.level}: \n${info.message}`)
            ),
            transports: [new winston.transports.Console()]
        });
    }
}
