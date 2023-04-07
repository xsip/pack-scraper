export class Logger {

    public static get = (className: string = '') => {
        return {
            info: (message: any) => console.info(`[${className}] ${message}`),
            info_raw: (message: any) => console.info(`${message}`),
            warn: (message: any) => console.warn(`[${className}] ${message}`),
            error: (message: any, error: any) => console.error(
                `[${className}] ${message}${error && error.stack ? error.stack : (error || '')}`),
            stopLogging: () => {
            }
        };
    };

    private static createInstance = () => {
    }
}
