"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedMiddleware = exports.LoggedInterceptor = exports.LoggedGuard = exports.LoggedRoute = exports.LoggedFunction = exports.REQUEST_LOG_ID = exports.LoggedController = exports.LoggedInjectable = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("./logger");
const reflected_1 = require("./reflected");
const functions_1 = require("./functions");
const RevRequestMethod = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "ALL",
    "OPTIONS",
    "HEAD",
    "SEARCH",
];
function loggerInit(_target) {
    if (!Object.getOwnPropertyNames(_target).includes("logger")) {
        const newTargetLogger = new common_1.Logger(_target.constructor.name);
        newTargetLogger.log("Logger Initialized.");
        Object.defineProperty(_target, "logger", {
            writable: false,
            enumerable: false,
            configurable: false,
            value: newTargetLogger,
        });
    }
}
function LoggedInjectable(options) {
    return (target) => {
        loggerInit(target.prototype);
        const logger = target.prototype.logger;
        const methods = Object.getOwnPropertyNames(target.prototype);
        methods.forEach((method) => {
            if (method !== "constructor" &&
                typeof target.prototype[method] === "function") {
                if (options && options.verbose)
                    logger.log(`LoggedFunction applied to ${method}`);
                LoggedFunction()(target.prototype, method, {
                    value: target.prototype[method],
                });
            }
        });
        (0, common_1.Injectable)(options)(target);
    };
}
exports.LoggedInjectable = LoggedInjectable;
function LoggedController(param) {
    return (target) => {
        loggerInit(target.prototype);
        const logger = target.prototype.logger;
        const methods = Object.getOwnPropertyNames(target.prototype);
        let verbose = typeof param === "object" && Object.keys(param).includes("verbose")
            ? param.verbose
            : false;
        methods.forEach((method) => {
            if (method !== "constructor" &&
                typeof target.prototype[method] === "function") {
                if (verbose) {
                    const path = Reflect.getMetadata("path", target.prototype[method]);
                    const httpMethod = Reflect.getMetadata("method", target.prototype[method]);
                    logger.log(`LoggedRoute applied to ${method} (${RevRequestMethod[httpMethod]} ${path})`);
                }
                LoggedRoute()(target.prototype, method, {
                    value: target.prototype[method],
                });
            }
        });
        (0, common_1.Controller)(param)(target);
    };
}
exports.LoggedController = LoggedController;
const defaultOverrideBuildOptions = {
    callLogLevel: 'log',
    returnLogLevel: 'log',
    errorLogLevel: 'error',
    skipCallLog: false,
    skipReturnLog: false,
    skipErrorLog: false,
};
class LoggedMetadata {
    constructor(options) {
        this.options = {
            ...defaultOverrideBuildOptions,
            ...(options ?? {}),
        };
    }
    updateOption(options) {
        this.options = {
            ...this.options,
            ...options
        };
    }
}
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
    if (type === 'guard' || type === 'interceptor' || type === 'middleware' || type === 'route')
        return `${message} ${callLogIdentifyMessageDictionary[type]} ${key} (${route})`;
    if (type === 'function')
        return `${message} ${callLogIdentifyMessageDictionary[type]} ${key}`;
    return `${message} ${callLogIdentifyMessageDictionary[type]}`;
}
exports.REQUEST_LOG_ID = '__nestlogged_request_log_id__';
function overrideBuild(type, originalFunction, baseLogger, metadatas, key, returnsData, logged, route) {
    return function (...args) {
        // Creating ScopedLogger
        let injectedLogger = baseLogger;
        if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
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
                        if (req[exports.REQUEST_LOG_ID] === undefined) {
                            req[exports.REQUEST_LOG_ID] = logger_1.ScopedLogger.createScopeId();
                        }
                        args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key, req[exports.REQUEST_LOG_ID]);
                    }
                }
                else if (type === 'middleware') {
                    let req = args[0];
                    if (req[exports.REQUEST_LOG_ID] === undefined) {
                        req[exports.REQUEST_LOG_ID] = logger_1.ScopedLogger.createScopeId();
                    }
                    args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key, req[exports.REQUEST_LOG_ID]);
                }
                else if (type === 'route') {
                    // args[metadatas.scopedLoggerInjectableParam] is now Request object, thanks to code in @LoggedRoute!!!!
                    let req = args[metadatas.scopedLoggerInjectableParam];
                    if (req[exports.REQUEST_LOG_ID] === undefined) {
                        req[exports.REQUEST_LOG_ID] = logger_1.ScopedLogger.createScopeId();
                    }
                    args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key, req[exports.REQUEST_LOG_ID]);
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
            const callLogIdentifyMessage = type === 'middleware' || type === 'guard' || type === 'interceptor' || type === 'route'
                ? createCallLogIdentifyMessage('HIT', type, key, route)
                : createCallLogIdentifyMessage('HIT', type, key);
            injectedLogger[logged.options.callLogLevel](`${callLogIdentifyMessage} ${metadatas.loggedParams && metadatas.loggedParams.length > 0
                ? "WITH " +
                    metadatas.loggedParams.map(({ name, index, include, exclude }) => name +
                        "=" +
                        (0, functions_1.imObjectContainedLogSync)(args[index], {
                            include,
                            exclude,
                        })).join(", ")
                : ""}`);
        }
        try {
            const r = originalFunction.call(this, ...args); // Try to call original function
            // Return Log
            if (logged.options.returnLogLevel !== 'skip') {
                if (originalFunction.constructor.name === 'AsyncFunction' ||
                    (r && typeof r === 'object' && typeof r['then'] === 'function')) {
                    return r['then']((r) => {
                        const resultLogged = Array.isArray(returnsData)
                            ? typeof r === "object" && r !== null
                                ? "WITH " +
                                    returnsData.map(({ name, path }) => {
                                        const value = (0, functions_1.getItemByPathSync)(r, path);
                                        return value !== undefined ? `${name}=${value}` : "";
                                    })
                                        .filter((v) => v.length > 0)
                                        .join(", ")
                                : ""
                            : typeof returnsData === 'string'
                                ? "WITH " + returnsData + "=" + typeof r === "object" ? JSON.stringify(r) : r
                                : returnsData
                                    ? typeof r === "object"
                                        ? "WITH " + JSON.stringify(r)
                                        : "WITH " + r
                                    : "";
                        injectedLogger[logged.options.returnLogLevel](`${createCallLogIdentifyMessage('RETURNED', type, key, route)} ${resultLogged}`);
                        return r;
                    });
                }
                else {
                    const resultLogged = Array.isArray(returnsData)
                        ? typeof r === "object" && r !== null
                            ? "WITH " +
                                returnsData.map(({ name, path }) => {
                                    const value = (0, functions_1.getItemByPathSync)(r, path);
                                    return value !== undefined ? `${name}=${value}` : "";
                                })
                                    .filter((v) => v.length > 0)
                                    .join(", ")
                            : ""
                        : typeof returnsData === 'string'
                            ? "WITH " + returnsData + "=" + typeof r === "object" ? JSON.stringify(r) : r
                            : returnsData
                                ? typeof r === "object"
                                    ? "WITH " + JSON.stringify(r)
                                    : "WITH " + r
                                : "";
                    injectedLogger[logged.options.returnLogLevel](`${createCallLogIdentifyMessage('RETURNED', type, key, route)} ${resultLogged}`);
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
                injectedLogger[logged.options.errorLogLevel](`${createCallLogIdentifyMessage('ERROR', type, key, route)} ${e}`);
            }
            throw e;
        }
    };
}
function LoggedFunction(options) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedFunction decorator applied to non-function property: ${key}`);
            return;
        }
        const logMetadata = Reflect.getOwnMetadata(reflected_1.nestLoggedMetadata, _target, key);
        if (logMetadata) {
            // already applied, override instead
            logMetadata.updateOption(options);
            return;
        }
        const newMetadata = new LoggedMetadata(options);
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild('function', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
        }, key, returnsData, newMetadata);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(reflected_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedFunction = LoggedFunction;
function LoggedRoute(route, options) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedRoute decorator applied to non-function property: ${key}`);
            return;
        }
        const logMetadata = Reflect.getOwnMetadata(reflected_1.nestLoggedMetadata, _target, key);
        if (logMetadata) {
            // already applied, override instead
            logMetadata.updateOption(options);
            return;
        }
        const newMetadata = new LoggedMetadata(options);
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const httpPath = Reflect.getMetadata("path", fn);
        const httpMethod = Reflect.getMetadata("method", fn);
        const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${RevRequestMethod[httpMethod]}]`;
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        // if @InjectLogger exists, fake nestjs as it is @Req()
        if (scopedLoggerInjectableParam !== undefined) {
            (0, reflected_1.createRouteParamDecorator)(0)()(_target, key, scopedLoggerInjectableParam);
        }
        const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild('route', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
        }, key, returnsData, newMetadata, fullRoute);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(reflected_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedRoute = LoggedRoute;
function LoggedGuard(options) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedGuard decorator applied to non-function property: ${key}`);
            return;
        }
        const logMetadata = Reflect.getOwnMetadata(reflected_1.nestLoggedMetadata, _target, key);
        if (logMetadata) {
            // already applied, override instead
            logMetadata.updateOption(options);
            return;
        }
        const newMetadata = new LoggedMetadata(options);
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild('guard', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams: [],
        }, _target.constructor.name, returnsData, newMetadata);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(reflected_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedGuard = LoggedGuard;
function LoggedInterceptor(options) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedInterceptor decorator applied to non-function property: ${key}`);
            return;
        }
        const logMetadata = Reflect.getOwnMetadata(reflected_1.nestLoggedMetadata, _target, key);
        if (logMetadata) {
            // already applied, override instead
            logMetadata.updateOption(options);
            return;
        }
        const newMetadata = new LoggedMetadata(options);
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild('interceptor', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams: [],
        }, _target.constructor.name, returnsData, newMetadata);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(reflected_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedInterceptor = LoggedInterceptor;
function LoggedMiddleware(options) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedMiddleware decorator applied to non-function property: ${key}`);
            return;
        }
        const logMetadata = Reflect.getOwnMetadata(reflected_1.nestLoggedMetadata, _target, key);
        if (logMetadata) {
            // already applied, override instead
            logMetadata.updateOption(options);
            return;
        }
        const newMetadata = new LoggedMetadata(options);
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild('middleware', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams: [],
        }, _target.constructor.name, returnsData, newMetadata);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(reflected_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedMiddleware = LoggedMiddleware;
