"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideBuild = void 0;
const utils_1 = require("./utils");
const utils_2 = require("../internals/utils");
const logger_1 = require("../logger");
function overrideBuild(type, originalFunction, baseLogger, metadatas, key, returnsData, logged, route) {
    return function (...args) {
        // Creating ScopedLogger
        let injectedLogger = baseLogger;
        if (typeof metadatas.scopedLoggerInjectableParam !== 'undefined') {
            if (type === 'function') {
                if (args.length <= metadatas.scopedLoggerInjectableParam ||
                    !(args[metadatas.scopedLoggerInjectableParam] instanceof logger_1.ScopedLogger)) {
                    args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key);
                }
                else {
                    args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromSuper(baseLogger, args[metadatas.scopedLoggerInjectableParam], key);
                }
            }
            else {
                // special, can access to request object
                if (type === 'guard' || type === 'interceptor') {
                    // args[0] == ExecutionContext
                    const ctx = args[0];
                    if (ctx.getType() !== 'http') {
                        injectedLogger.error('Cannot inject logger: Request type is not http');
                    }
                    else {
                        let req = ctx.switchToHttp().getRequest();
                        if (req[utils_1.REQUEST_LOG_ID] === undefined) {
                            req[utils_1.REQUEST_LOG_ID] = logger_1.ScopedLogger.createScopeId();
                        }
                        args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key, req[utils_1.REQUEST_LOG_ID]);
                    }
                }
                else if (type === 'middleware') {
                    let req = args[0];
                    if (req[utils_1.REQUEST_LOG_ID] === undefined) {
                        req[utils_1.REQUEST_LOG_ID] = logger_1.ScopedLogger.createScopeId();
                    }
                    args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key, req[utils_1.REQUEST_LOG_ID]);
                }
                else if (type === 'route') {
                    // args[metadatas.scopedLoggerInjectableParam] is now Request object, thanks to code in @LoggedRoute!!!!
                    let req = args[metadatas.scopedLoggerInjectableParam];
                    if (req[utils_1.REQUEST_LOG_ID] === undefined) {
                        req[utils_1.REQUEST_LOG_ID] = logger_1.ScopedLogger.createScopeId();
                    }
                    args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key, req[utils_1.REQUEST_LOG_ID]);
                }
            }
            injectedLogger = args[metadatas.scopedLoggerInjectableParam];
        }
        // If this is ExecutionContext based function (e.g. Guard, Interceptor) get Request from Context
        if (type === 'guard' || type === 'interceptor') {
            const context = args[0];
            if (context.getType() === 'http') {
                const req = context.switchToHttp().getRequest();
                route = /* supporting FastifyRequest */ req.raw ? req.raw.url : req.url;
            }
        }
        // Start Log
        if (logged.options.callLogLevel !== 'skip') {
            const callLogIdentifyMessage = type === 'middleware' ||
                type === 'guard' ||
                type === 'interceptor' ||
                type === 'route'
                ? (0, utils_1.createCallLogIdentifyMessage)('HIT', type, key, route)
                : (0, utils_1.createCallLogIdentifyMessage)('HIT', type, key);
            injectedLogger[logged.options.callLogLevel](`${callLogIdentifyMessage} ${metadatas.loggedParams && metadatas.loggedParams.length > 0
                ? 'WITH ' +
                    metadatas.loggedParams
                        .map(({ name, index, include, exclude }) => name +
                        '=' +
                        (0, utils_2.objectContainedLogSync)(args[index], {
                            include,
                            exclude,
                        }))
                        .join(', ')
                : ''}`);
        }
        try {
            const r = originalFunction.call(this, ...args); // Try to call original function
            // Return Log
            if (logged.options.returnLogLevel !== 'skip') {
                if (originalFunction.constructor.name === 'AsyncFunction' ||
                    (r && typeof r === 'object' && typeof r['then'] === 'function')) {
                    return r['then']((r) => {
                        const resultLogged = Array.isArray(returnsData)
                            ? typeof r === 'object' && r !== null
                                ? 'WITH ' +
                                    returnsData
                                        .map(({ name, path }) => {
                                        const value = (0, utils_2.getItemByPathSync)(r, path);
                                        return value !== undefined ? `${name}=${value}` : '';
                                    })
                                        .filter((v) => v.length > 0)
                                        .join(', ')
                                : ''
                            : typeof returnsData === 'string'
                                ? 'WITH ' + returnsData + '=' + typeof r === 'object'
                                    ? JSON.stringify(r)
                                    : r
                                : returnsData
                                    ? typeof r === 'object'
                                        ? 'WITH ' + JSON.stringify(r)
                                        : 'WITH ' + r
                                    : '';
                        injectedLogger[logged.options.returnLogLevel](`${(0, utils_1.createCallLogIdentifyMessage)('RETURNED', type, key, route)} ${resultLogged}`);
                        return r;
                    });
                }
                else {
                    const resultLogged = Array.isArray(returnsData)
                        ? typeof r === 'object' && r !== null
                            ? 'WITH ' +
                                returnsData
                                    .map(({ name, path }) => {
                                    const value = (0, utils_2.getItemByPathSync)(r, path);
                                    return value !== undefined ? `${name}=${value}` : '';
                                })
                                    .filter((v) => v.length > 0)
                                    .join(', ')
                            : ''
                        : typeof returnsData === 'string'
                            ? 'WITH ' + returnsData + '=' + typeof r === 'object'
                                ? JSON.stringify(r)
                                : r
                            : returnsData
                                ? typeof r === 'object'
                                    ? 'WITH ' + JSON.stringify(r)
                                    : 'WITH ' + r
                                : '';
                    injectedLogger[logged.options.returnLogLevel](`${(0, utils_1.createCallLogIdentifyMessage)('RETURNED', type, key, route)} ${resultLogged}`);
                    return r;
                }
            }
            else {
                return r;
            }
        }
        catch (e) {
            // Error Log
            if (logged.options.errorLogLevel !== 'skip') {
                injectedLogger[logged.options.errorLogLevel](`${(0, utils_1.createCallLogIdentifyMessage)('ERROR', type, key, route)} ${e}`);
            }
            throw e;
        }
    };
}
exports.overrideBuild = overrideBuild;
