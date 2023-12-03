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
        methods.forEach((method) => {
            if (method !== "constructor" &&
                typeof target.prototype[method] === "function") {
                const path = Reflect.getMetadata("path", target.prototype[method]);
                const httpMethod = Reflect.getMetadata("method", target.prototype[method]);
                logger.log(`LoggedRoute applied to ${method} (${RevRequestMethod[httpMethod]} ${path})`);
                LoggedRoute()(target.prototype, method, {
                    value: target.prototype[method],
                });
                Reflect.defineMetadata("path", path, target.prototype[method]);
                Reflect.defineMetadata("method", httpMethod, target.prototype[method]);
            }
        });
        (0, common_1.Controller)(param)(target);
    };
}
exports.LoggedController = LoggedController;
function LoggedFunction(_target, key, descriptor) {
    loggerInit(_target);
    const logger = _target.logger;
    const fn = descriptor.value;
    if (!fn || typeof fn !== "function") {
        logger.warn(`LoggedFunction decorator applied to non-function property: ${key}`);
        return;
    }
    _target[key] = async function (...args) {
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        if (typeof scopedLoggerInjectableParam !== "undefined" &&
            (args.length <= scopedLoggerInjectableParam ||
                !(args[scopedLoggerInjectableParam] instanceof logger_1.ScopedLogger))) {
            args[scopedLoggerInjectableParam] = new logger_1.ScopedLogger(logger, key);
        }
        else if (typeof scopedLoggerInjectableParam !== "undefined") {
            args[scopedLoggerInjectableParam] = new logger_1.ScopedLogger(args[scopedLoggerInjectableParam], key);
        }
        const injectedLogger = typeof scopedLoggerInjectableParam !== "undefined"
            ? args[scopedLoggerInjectableParam]
            : logger;
        const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
        injectedLogger.log(`CALL ${key} ${loggedParams && loggedParams.length > 0
            ? "WITH " +
                (await Promise.all(loggedParams.map(async ({ name, index, include, exclude }) => name +
                    "=" +
                    (await (0, functions_1.default)(args[index], {
                        include,
                        exclude,
                    }))))).join(", ")
            : ""}`);
        try {
            const r = await fn.call(this, ...args);
            injectedLogger.log(`RETURNED ${key}`);
            return r;
        }
        catch (e) {
            injectedLogger.error(`WHILE ${key} ERROR ${e}`);
            throw e;
        }
    };
}
exports.LoggedFunction = LoggedFunction;
function LoggedRoute(route) {
    return (_target, key, descriptor) => {
        loggerInit(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        const httpPath = Reflect.getMetadata("path", fn);
        const httpMethod = Reflect.getMetadata("method", fn);
        const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${RevRequestMethod[httpMethod]}]`;
        if (!fn || typeof fn !== "function") {
            logger.warn(`LoggedRoute decorator applied to non-function property: ${key}`);
            return;
        }
        _target[key] = async function (...args) {
            const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
            if (typeof scopedLoggerInjectableParam !== "undefined" &&
                (args.length <= scopedLoggerInjectableParam ||
                    !(args[scopedLoggerInjectableParam] instanceof logger_1.ScopedLogger))) {
                args[scopedLoggerInjectableParam] = new logger_1.ScopedLogger(logger, fullRoute);
            }
            const injectedLogger = typeof scopedLoggerInjectableParam !== "undefined"
                ? args[scopedLoggerInjectableParam]
                : logger;
            const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
            injectedLogger.log(`HIT HTTP ${fullRoute} (${key}) ${loggedParams && loggedParams.length > 0
                ? "WITH " +
                    (await Promise.all(loggedParams.map(async ({ name, index, include, exclude }) => name +
                        "=" +
                        (await (0, functions_1.default)(args[index], {
                            include,
                            exclude,
                        }))))).join(", ")
                : ""}`);
            try {
                const r = await fn.call(this, ...args);
                injectedLogger.log(`RETURNED RESPONSE ${fullRoute} (${key})`);
                return r;
            }
            catch (e) {
                injectedLogger.error(`WHILE HTTP ${fullRoute} (${key}) ERROR ${e}`);
                throw e;
            }
        };
        return [httpPath, httpMethod];
    };
}
exports.LoggedRoute = LoggedRoute;
