"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOverrideBuildOptions = exports.REQUEST_LOG_ID = exports.createCallLogIdentifyMessage = exports.loggerInit = exports.RevRequestMethod = void 0;
const common_1 = require("@nestjs/common");
exports.RevRequestMethod = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'ALL',
    'OPTIONS',
    'HEAD',
    'SEARCH',
];
function loggerInit(_target) {
    if (!Object.getOwnPropertyNames(_target).includes('logger')) {
        const newTargetLogger = new common_1.Logger(_target.constructor.name);
        newTargetLogger.log('Logger Initialized.');
        Object.defineProperty(_target, 'logger', {
            writable: false,
            enumerable: false,
            configurable: false,
            value: newTargetLogger,
        });
    }
}
exports.loggerInit = loggerInit;
const callLogIdentifyMessageDictionary = {
    route: 'ENDPOINT',
    function: 'FUNCTION',
    guard: 'GUARD',
    interceptor: 'INTERCEPTOR',
    middleware: 'MIDDLEWARE',
};
function createCallLogIdentifyMessage(message, type, key, route) {
    if (message === 'ERROR')
        return `ERROR WHILE ${callLogIdentifyMessageDictionary[type]} ${key} (${route}): `;
    if (type === 'guard' ||
        type === 'interceptor' ||
        type === 'middleware' ||
        type === 'route')
        return `${message} ${callLogIdentifyMessageDictionary[type]} ${key} (${route})`;
    if (type === 'function')
        return `${message} ${callLogIdentifyMessageDictionary[type]} ${key}`;
    return `${message} ${callLogIdentifyMessageDictionary[type]}`;
}
exports.createCallLogIdentifyMessage = createCallLogIdentifyMessage;
exports.REQUEST_LOG_ID = '__nestlogged_request_log_id__';
exports.defaultOverrideBuildOptions = {
    callLogLevel: 'log',
    returnLogLevel: 'log',
    errorLogLevel: 'error',
    skipCallLog: false,
    skipReturnLog: false,
    skipErrorLog: false,
};
