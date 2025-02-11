"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedRoute = exports.LoggedFunction = exports.LoggedController = exports.LoggedInjectable = void 0;
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
function overrideBuild(originalFunction, baseLogger, metadatas, key, returnsData, logged, route) {
    return function (...args) {
        let injectedLogger = baseLogger;
        if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
            if (args.length <= metadatas.scopedLoggerInjectableParam ||
                !(args[metadatas.scopedLoggerInjectableParam] instanceof logger_1.ScopedLogger)) {
                args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromRoot(baseLogger, key);
            }
            else {
                args[metadatas.scopedLoggerInjectableParam] = logger_1.ScopedLogger.fromSuper(baseLogger, args[metadatas.scopedLoggerInjectableParam], key);
            }
            injectedLogger = args[metadatas.scopedLoggerInjectableParam];
        }
        if (logged.options.callLogLevel !== 'skip') {
            injectedLogger[logged.options.callLogLevel](`${route ? "HIT HTTP" : "CALL"} ${route ? `${route.fullRoute} (${key})` : key} ${metadatas.loggedParams && metadatas.loggedParams.length > 0
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
            const r = originalFunction.call(this, ...args);
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
                        injectedLogger[logged.options.returnLogLevel](route
                            ? `RETURNED HTTP ${route.fullRoute} (${key}) ${resultLogged}`
                            : `RETURNED ${key} ${resultLogged}`);
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
                    injectedLogger[logged.options.returnLogLevel](route
                        ? `RETURNED HTTP ${route.fullRoute} (${key}) ${resultLogged}`
                        : `RETURNED ${key} ${resultLogged}`);
                    return r;
                }
            }
            else {
                return r;
            }
        }
        catch (e) {
            if (logged.options.errorLogLevel !== 'skip') {
                injectedLogger[logged.options.errorLogLevel](`WHILE ${route ? `HTTP ${route.fullRoute} (${key})` : key} ERROR ${e}`);
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
        const scopeKeys = Reflect.getOwnMetadata(reflected_1.scopeKey, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild(fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
            scopeKeys,
        }, key, returnsData, newMetadata, undefined);
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
        const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
        const scopeKeys = Reflect.getOwnMetadata(reflected_1.scopeKey, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild(fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
            scopeKeys,
        }, key, returnsData, newMetadata, {
            fullRoute,
        });
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
