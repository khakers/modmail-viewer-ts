import { env } from '$env/dynamic/private';
import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';

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
export const baseLogger = pino({
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

interface LoggerStore {
    logger: pino.Logger;
}

export const context = new AsyncLocalStorage<LoggerStore>();

export const logger =  new Proxy(baseLogger, {
    get(target, property, receiver) {
        target = context.getStore()?.logger ?? target;
        return Reflect.get(target, property, receiver);
    },
});
