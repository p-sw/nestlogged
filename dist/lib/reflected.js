"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShouldScoped = exports.Returns = exports.ScopeKey = exports.LoggedParam = exports.InjectLogger = exports.returns = exports.forceScopeKey = exports.scopeKey = exports.loggedParam = exports.scopedLogger = void 0;
exports.scopedLogger = Symbol("nlogdec-scopedLogger");
exports.loggedParam = Symbol("nlogdec-loggedParam");
exports.scopeKey = Symbol("nlogdec-scopeKey");
exports.forceScopeKey = Symbol("nlogdec-forceScopeKey");
exports.returns = Symbol("nlogdec-returns");
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
            // If path is provided in string[] type, convert it to string path because it is used in string type
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
function ScopeKey(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const existingScopeKeys = Reflect.getOwnMetadata(exports.scopeKey, target, propertyKey) || [];
        existingScopeKeys.push({
            name,
            index: parameterIndex,
            path: Array.isArray(options?.path)
                ? options.path
                : options?.path?.split("."),
            priority: options?.priority,
        });
        existingScopeKeys.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1));
        Reflect.defineMetadata(exports.scopeKey, existingScopeKeys, target, propertyKey);
    };
}
exports.ScopeKey = ScopeKey;
function Returns(namePaths) {
    return (_target, _key, descriptor) => {
        Reflect.defineMetadata(exports.returns, namePaths
            ? Object.entries(namePaths).reduce((prev, curr) => [...prev, { name: curr[0], path: curr[1] }], [])
            : true, descriptor.value);
    };
}
exports.Returns = Returns;
function ShouldScoped(_target, _key, descriptor) {
    Reflect.defineMetadata(exports.forceScopeKey, true, descriptor.value);
}
exports.ShouldScoped = ShouldScoped;
