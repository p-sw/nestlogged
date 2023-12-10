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
                const all = Reflect.getMetadataKeys(target.prototype[method]).map((k) => [k, Reflect.getMetadata(k, target.prototype[method])]);
                if (options && options.verbose)
                    logger.log(`LoggedFunction applied to ${method}`);
                LoggedFunction(target.prototype, method, {
                    value: target.prototype[method],
                });
                all.forEach(([k, v]) => Reflect.defineMetadata(k, v, target.prototype[method]));
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
                const path = Reflect.getMetadata("path", target.prototype[method]);
                const httpMethod = Reflect.getMetadata("method", target.prototype[method]);
                const all = Reflect.getMetadataKeys(target.prototype[method]).map((k) => [k, Reflect.getMetadata(k, target.prototype[method])]);
                if (verbose)
                    logger.log(`LoggedRoute applied to ${method} (${RevRequestMethod[httpMethod]} ${path})`);
                LoggedRoute()(target.prototype, method, {
                    value: target.prototype[method],
                });
                all.forEach(([k, v]) => Reflect.defineMetadata(k, v, target.prototype[method]));
            }
        });
        (0, common_1.Controller)(param)(target);
    };
}
exports.LoggedController = LoggedController;
function overrideBuild(originalFunction, baseLogger, metadatas, key, route) {
    return async function (...args) {
        let injectedLogger = baseLogger;
        if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
            if (args.length <= metadatas.scopedLoggerInjectableParam ||
                !(args[metadatas.scopedLoggerInjectableParam] instanceof logger_1.ScopedLogger)) {
                args[metadatas.scopedLoggerInjectableParam] = new logger_1.ScopedLogger(baseLogger, key);
            }
            else {
                args[metadatas.scopedLoggerInjectableParam] = new logger_1.ScopedLogger(args[metadatas.scopedLoggerInjectableParam], key);
            }
            injectedLogger = args[metadatas.scopedLoggerInjectableParam];
            if (Array.isArray(metadatas.scopeKeys)) {
                const scopeKeyResults = metadatas.scopeKeys.map((key) => {
                    const argsValue = args[key.index];
                    if (!key.path) {
                        if (!metadatas.shouldScoped || argsValue) {
                            return { error: false, value: `${key.name}=${argsValue}` };
                        }
                        else {
                            return {
                                error: true,
                                value: `ScopeKey in ShouldScope cannot be falsy value (${argsValue})`,
                            };
                        }
                    }
                    try {
                        const reduceResult = key.path.reduce((base, keyPath) => {
                            if (typeof base !== "object" ||
                                !Object.keys(base).includes(keyPath))
                                throw new Error(`Cannot find key ${keyPath} in ${typeof base === "object" ? JSON.stringify(base) : base}`);
                            return base[keyPath];
                        }, argsValue);
                        return { error: false, value: `${key.name}=${reduceResult}` };
                    }
                    catch (e) {
                        return { error: true, value: e.message };
                    }
                });
                const successResults = scopeKeyResults.filter((v) => v.error === false);
                if (successResults.length === 0) {
                    if (metadatas.shouldScoped) {
                        scopeKeyResults.forEach((v) => injectedLogger.warn(v.value));
                    }
                }
                else {
                    injectedLogger.addScope(successResults[0].value);
                }
            }
        }
        injectedLogger.log(`${route ? "HIT HTTP" : "CALL"} ${route ? `${route.fullRoute} (${key})` : key} ${metadatas.loggedParams && metadatas.loggedParams.length > 0
            ? "WITH " +
                (await Promise.all(metadatas.loggedParams.map(async ({ name, index, include, exclude }) => name +
                    "=" +
                    (await (0, functions_1.default)(args[index], {
                        include,
                        exclude,
                    }))))).join(", ")
            : ""}`);
        try {
            const r = await originalFunction.call(this, ...args);
            injectedLogger.log(route
                ? `RETURNED RESPONSE ${route.fullRoute} (${key})`
                : `RETURNED ${key}`);
            return r;
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
    const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_2.scopedLogger, _target, key);
    const loggedParams = Reflect.getOwnMetadata(reflected_2.loggedParam, _target, key);
    const scopeKeys = Reflect.getOwnMetadata(reflected_1.scopeKey, _target, key);
    const shouldScoped = Reflect.getOwnMetadata(reflected_1.forceScopeKey, fn);
    const overrideFunction = overrideBuild(fn, logger, {
        scopedLoggerInjectableParam,
        loggedParams,
        scopeKeys,
        shouldScoped,
    }, key);
    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;
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
        const httpPath = Reflect.getMetadata("path", fn);
        const httpMethod = Reflect.getMetadata("method", fn);
        const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${RevRequestMethod[httpMethod]}]`;
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_2.scopedLogger, _target, key);
        const loggedParams = Reflect.getOwnMetadata(reflected_2.loggedParam, _target, key);
        const scopeKeys = Reflect.getOwnMetadata(reflected_1.scopeKey, _target, key);
        const shouldScoped = Reflect.getOwnMetadata(reflected_1.forceScopeKey, fn);
        const overrideFunction = overrideBuild(fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
            scopeKeys,
            shouldScoped,
        }, key, {
            fullRoute,
        });
    };
}
exports.LoggedRoute = LoggedRoute;
