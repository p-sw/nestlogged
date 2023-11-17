"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedRoute = exports.LoggedFunction = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("./logger");
const reflected_1 = require("./reflected");
const functions_1 = require("./functions");
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
function LoggedFunction(_target, key, descriptor) {
    loggerInit(_target);
    const logger = _target.logger;
    const fn = descriptor.value;
    if (!fn)
        return;
    descriptor.value = async function (...args) {
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        if (typeof scopedLoggerInjectableParam !== 'undefined' &&
            (args.length <= scopedLoggerInjectableParam ||
                !(args[scopedLoggerInjectableParam] instanceof logger_1.default))) {
            args[scopedLoggerInjectableParam] = new logger_1.default(logger, key);
        }
        else if (typeof scopedLoggerInjectableParam !== 'undefined') {
            args[scopedLoggerInjectableParam] = new logger_1.default(args[scopedLoggerInjectableParam], key);
        }
        const injectedLogger = typeof scopedLoggerInjectableParam !== 'undefined'
            ? args[scopedLoggerInjectableParam]
            : logger;
        const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
        injectedLogger.log(`CALL ${key} ${loggedParams && loggedParams.length > 0
            ? 'WITH ' +
                (await Promise.all(loggedParams.map(async ({ name, index, include, exclude }) => name + '=' + (await (0, functions_1.default)(args[index], {
                    include,
                    exclude,
                }))))).join(', ')
            : ''}`);
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
        const fullRoute = `${_target.constructor.name}/${route}`;
        const fn = descriptor.value;
        if (!fn)
            return;
        descriptor.value = async function (...args) {
            const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
            if (typeof scopedLoggerInjectableParam !== 'undefined' &&
                (args.length <= scopedLoggerInjectableParam ||
                    !(args[scopedLoggerInjectableParam] instanceof logger_1.default))) {
                args[scopedLoggerInjectableParam] = new logger_1.default(logger, fullRoute);
            }
            const injectedLogger = typeof scopedLoggerInjectableParam !== 'undefined'
                ? args[scopedLoggerInjectableParam]
                : logger;
            const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
            injectedLogger.log(`HIT HTTP ${fullRoute} (${key}) ${loggedParams && loggedParams.length > 0
                ? 'WITH ' +
                    (await Promise.all(loggedParams.map(async ({ name, index, include, exclude }) => name + '=' + (await (0, functions_1.default)(args[index], {
                        include,
                        exclude,
                    }))))).join(', ')
                : ''}`);
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
    };
}
exports.LoggedRoute = LoggedRoute;
//# sourceMappingURL=logged.js.map