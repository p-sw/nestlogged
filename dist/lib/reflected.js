"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedParam = exports.InjectLogger = exports.loggedParam = exports.scopedLogger = void 0;
exports.scopedLogger = Symbol("scopedLogger");
exports.loggedParam = Symbol("loggedParam");
function InjectLogger(target, propertyKey, parameterIndex) {
    Reflect.defineMetadata(exports.scopedLogger, parameterIndex, target, propertyKey);
}
exports.InjectLogger = InjectLogger;
function LoggedParam(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const existingLoggedParams = Reflect.getOwnMetadata(exports.loggedParam, target, propertyKey) || [];
        existingLoggedParams.push({
            name,
            index: parameterIndex,
            include: options &&
                options.includePath &&
                options.includePath.map((v) => (Array.isArray(v) ? v.join(".") : v)),
            exclude: options &&
                options.excludePath &&
                options.excludePath.map((v) => (Array.isArray(v) ? v.join(".") : v)),
        });
        Reflect.defineMetadata(exports.loggedParam, existingLoggedParams, target, propertyKey);
    };
}
exports.LoggedParam = LoggedParam;
