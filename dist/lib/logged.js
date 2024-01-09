"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedRoute = exports.LoggedFunction = exports.LoggedController = exports.LoggedInjectable = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("./logger");
const reflected_1 = require("./reflected");
const reflected_2 = require("./reflected");
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
                LoggedFunction(target.prototype, method, {
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
function overrideBuild(originalFunction, baseLogger, metadatas, key, returnsData, route) {
    return function (...args) {
        let injectedLogger = baseLogger;
        if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
            if (args.length <= metadatas.scopedLoggerInjectableParam ||
                !(args[metadatas.scopedLoggerInjectableParam] instanceof logger_1.ScopedLogger)) {
                args[metadatas.scopedLoggerInjectableParam] = new logger_1.ScopedLogger(baseLogger, key, true, true);
            }
            else {
                args[metadatas.scopedLoggerInjectableParam] = new logger_1.ScopedLogger(args[metadatas.scopedLoggerInjectableParam], key, false);
            }
            injectedLogger = args[metadatas.scopedLoggerInjectableParam];
        }
        injectedLogger.log(`${route ? "HIT HTTP" : "CALL"} ${route ? `${route.fullRoute} (${key})` : key} ${metadatas.loggedParams && metadatas.loggedParams.length > 0
            ? "WITH " +
                metadatas.loggedParams.map(({ name, index, include, exclude }) => name +
                    "=" +
                    (0, functions_1.objectContainedLoggedSync)(args[index], {
                        include,
                        exclude,
                    })).join(", ")
            : ""}`);
        try {
            const r = originalFunction.call(this, ...args);
            if (originalFunction.constructor.name === 'AsyncFunction' ||
                (typeof r === 'object' && typeof r['then'] === 'function')) {
                return r['then']((r) => {
                    const resultLogged = Array.isArray(returnsData)
                        ? typeof r === "object"
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
                    injectedLogger.log(route
                        ? `RETURNED HTTP ${route.fullRoute} (${key}) ${resultLogged}`
                        : `RETURNED ${key} ${resultLogged}`);
                    return r;
                });
            }
            else {
                const resultLogged = Array.isArray(returnsData)
                    ? typeof r === "object"
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
                injectedLogger.log(route
                    ? `RETURNED HTTP ${route.fullRoute} (${key}) ${resultLogged}`
                    : `RETURNED ${key} ${resultLogged}`);
                return r;
            }
        }
        catch (e) {
            injectedLogger.error(`WHILE ${route ? `HTTP ${route.fullRoute} (${key})` : key} ERROR ${e}`);
            throw e;
        }
    };
}
function LoggedFunction(_target, key, descriptor) {
    loggerInit(_target);
    const logger = _target.logger;
    const fn = descriptor.value;
    if (!fn || typeof fn !== "function") {
        logger.warn(`LoggedFunction decorator applied to non-function property: ${key}`);
        return;
    }
    const all = Reflect.getMetadataKeys(fn).map((k) => [
        k,
        Reflect.getMetadata(k, fn),
    ]);
    const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_2.scopedLogger, _target, key);
    const loggedParams = Reflect.getOwnMetadata(reflected_2.loggedParam, _target, key);
    const scopeKeys = Reflect.getOwnMetadata(reflected_1.scopeKey, _target, key);
    const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
    const overrideFunction = overrideBuild(fn, logger, {
        scopedLoggerInjectableParam,
        loggedParams,
        scopeKeys,
    }, key, returnsData);
    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;
    all.forEach(([k, v]) => {
        Reflect.defineMetadata(k, v, _target[key]);
        Reflect.defineMetadata(k, v, descriptor.value);
    });
}
exports.LoggedFunction = LoggedFunction;
function LoggedRoute(route) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedRoute decorator applied to non-function property: ${key}`);
            return;
        }
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const httpPath = Reflect.getMetadata("path", fn);
        const httpMethod = Reflect.getMetadata("method", fn);
        const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${RevRequestMethod[httpMethod]}]`;
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_2.scopedLogger, _target, key);
        const loggedParams = Reflect.getOwnMetadata(reflected_2.loggedParam, _target, key);
        const scopeKeys = Reflect.getOwnMetadata(reflected_1.scopeKey, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = overrideBuild(fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
            scopeKeys,
        }, key, returnsData, {
            fullRoute,
        });
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedRoute = LoggedRoute;
