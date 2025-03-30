import { env } from '$env/dynamic/private';
import pino from 'pino';
let transport: pino.LoggerOptions['transport'];

if (process.env.NODE_ENV === 'development') {
    transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
        }
    };
}

const logLevel = (env.LOG_LEVEL !== undefined && env.LOG_LEVEL !== "") ? env.LOG_LEVEL : env.NODE_ENV === 'development' ? 'debug' : 'info';
console.log(`Logger initialized with log level: ${logLevel}`);
export const logger = pino({
    level: logLevel,
    formatters: {
        log(object) {
            if (object instanceof Request) {
                const url = new URL(object.url);
                return {
                    method: object.method,
                    url: object.url,
                    path: url.pathname,
                    query: url.searchParams.entries,
                    agent: object.headers.get('user-agent')
                };
            }
            return object;
        }
    },
    redact: {
        paths: ['accessToken', 'refreshToken', 'secret', 'connection_uri', "mongoClient"],
    },
    transport
});