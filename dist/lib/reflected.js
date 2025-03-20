"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Returns = exports.LoggedHeaders = exports.LoggedBody = exports.LoggedQuery = exports.LoggedParam = exports.Logged = exports.InjectLogger = exports.nestLoggedMetadata = exports.returns = exports.loggedParam = exports.scopedLogger = exports.createRouteParamDecorator = void 0;
const route_paramtypes_enum_1 = require("@nestjs/common/enums/route-paramtypes.enum");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const ROUTE_ARGS_METADATA = '__routeArguments__';
function createRouteParamDecorator(paramtype) {
    return (data) => (target, key, index) => {
        const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
        Reflect.defineMetadata(ROUTE_ARGS_METADATA, (0, common_1.assignMetadata)(args, paramtype, index, data), target.constructor, key);
    };
}
exports.createRouteParamDecorator = createRouteParamDecorator;
const createPipesRouteParamDecorator = (paramtype) => (data, ...pipes) => (target, key, index) => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
    const hasParamData = (0, shared_utils_1.isNil)(data) || (0, shared_utils_1.isString)(data);
    const paramData = hasParamData ? data : undefined;
    const paramPipes = hasParamData ? pipes : [data, ...pipes];
    Reflect.defineMetadata(ROUTE_ARGS_METADATA, (0, common_1.assignMetadata)(args, paramtype, index, paramData, ...paramPipes), target.constructor, key);
};
exports.scopedLogger = Symbol("nlogdec-scopedLogger");
exports.loggedParam = Symbol("nlogdec-loggedParam");
exports.returns = Symbol("nlogdec-returns");
exports.nestLoggedMetadata = Symbol("nlogdec-metadata");
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
                options.includePath.map((v) => (Array.isArray(v) ? v.join(".") : v)),
            exclude: options &&
                options.excludePath &&
                options.excludePath.map((v) => (Array.isArray(v) ? v.join(".") : v)),
        });
        Reflect.defineMetadata(exports.loggedParam, existingLoggedParams, target, propertyKey);
    };
}
const Logged = (name, options) => createLoggedFunctionParam(name, options);
exports.Logged = Logged;
function LoggedParam(property, ...pipes) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.PARAM)(property, ...pipes)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedParam = LoggedParam;
function LoggedQuery(property, ...pipes) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.QUERY)(property, ...pipes)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedQuery = LoggedQuery;
function LoggedBody(property, ...pipes) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.BODY)(property, ...pipes)(target, propertyKey, parameterIndex);
            createLoggedFunctionParam(name, options)(target, propertyKey, parameterIndex);
        };
    };
}
exports.LoggedBody = LoggedBody;
function LoggedHeaders(property) {
    return (name, options) => {
        return (target, propertyKey, parameterIndex) => {
            createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.HEADERS)(property)(target, propertyKey, parameterIndex);
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
