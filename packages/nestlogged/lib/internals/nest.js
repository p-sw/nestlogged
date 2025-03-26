"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipesRouteParamDecorator = exports.createRouteParamDecorator = exports.ROUTE_ARGS_METADATA = exports.RouteParamtypes = void 0;
const route_paramtypes_enum_1 = require("@nestjs/common/enums/route-paramtypes.enum");
Object.defineProperty(exports, "RouteParamtypes", { enumerable: true, get: function () { return route_paramtypes_enum_1.RouteParamtypes; } });
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
Object.defineProperty(exports, "ROUTE_ARGS_METADATA", { enumerable: true, get: function () { return constants_1.ROUTE_ARGS_METADATA; } });
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
function createRouteParamDecorator(paramtype) {
    return (data) => (target, key, index) => {
        const args = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, target.constructor, key) || {};
        Reflect.defineMetadata(constants_1.ROUTE_ARGS_METADATA, (0, common_1.assignMetadata)(args, paramtype, index, data), target.constructor, key);
    };
}
exports.createRouteParamDecorator = createRouteParamDecorator;
const createPipesRouteParamDecorator = (paramtype) => (data, ...pipes) => (target, key, index) => {
    const args = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, target.constructor, key) || {};
    const hasParamData = (0, shared_utils_1.isNil)(data) || (0, shared_utils_1.isString)(data);
    const paramData = hasParamData ? data : undefined;
    const paramPipes = hasParamData ? pipes : [data, ...pipes];
    Reflect.defineMetadata(constants_1.ROUTE_ARGS_METADATA, (0, common_1.assignMetadata)(args, paramtype, index, paramData, ...paramPipes), target.constructor, key);
};
exports.createPipesRouteParamDecorator = createPipesRouteParamDecorator;
