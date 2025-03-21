"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Returns = exports.LoggedHeaders = exports.LoggedBody = exports.LoggedQuery = exports.LoggedParam = exports.Logged = exports.InjectLogger = exports.returns = exports.loggedParam = exports.scopedLogger = void 0;
const nest_1 = require("./internals/nest");
exports.scopedLogger = Symbol('nlogdec-scopedLogger');
exports.loggedParam = Symbol('nlogdec-loggedParam');
exports.returns = Symbol('nlogdec-returns');
function InjectLogger(target, propertyKey, parameterIndex) {
    Reflect.defineMetadata(exports.scopedLogger, parameterIndex, target, propertyKey);
}
exports.InjectLogger = InjectLogger;
function createLoggedFunctionParam(name, options) {
    return (target, propertyKey, parameterIndex) => {
        const existingLoggedParams = Reflect.getOwnMetadata(exports.loggedParam, target, propertyKey) || [];
        existingLoggedParams.push({
            name,
            index: parameterIndex,
            // If path is provided in string[] type, convert it to string path because it is used in string type
            include: options &&
                options.includePath &&
                options.includePath.map((v) => (Array.isArray(v) ? v.join('.') : v)),
            exclude: options &&
                options.excludePath &&
                options.excludePath.map((v) => (Array.isArray(v) ? v.join('.') : v)),
        });
        Reflect.defineMetadata(exports.loggedParam, existingLoggedParams, target, propertyKey);
    };
}
const Logged = (name, options) => createLoggedFunctionParam(name, options);
exports.Logged = Logged;
function LoggedParam(property, ...pipes) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            (0, nest_1.createPipesRouteParamDecorator)(nest_1.RouteParamtypes.PARAM)(property, ...pipes)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedParam = LoggedParam;
function LoggedQuery(property, ...pipes) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            (0, nest_1.createPipesRouteParamDecorator)(nest_1.RouteParamtypes.QUERY)(property, ...pipes)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedQuery = LoggedQuery;
function LoggedBody(property, ...pipes) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            (0, nest_1.createPipesRouteParamDecorator)(nest_1.RouteParamtypes.BODY)(property, ...pipes)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedBody = LoggedBody;
function LoggedHeaders(property) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            (0, nest_1.createRouteParamDecorator)(nest_1.RouteParamtypes.HEADERS)(property)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedHeaders = LoggedHeaders;
function Returns(namePaths) {
    return (_target, _key, descriptor) => {
        Reflect.defineMetadata(exports.returns, namePaths
            ? typeof namePaths === 'string'
                ? namePaths
                : Object.entries(namePaths).reduce((prev, curr) => [...prev, { name: curr[0], path: curr[1] }], [])
            : true, descriptor.value);
    };
}
exports.Returns = Returns;
