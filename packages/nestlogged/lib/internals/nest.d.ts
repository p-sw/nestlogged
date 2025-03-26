import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ParamData, PipeTransform, Type } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
export { RouteParamtypes, PipeTransform, Type, ROUTE_ARGS_METADATA };
export declare function createRouteParamDecorator(paramtype: RouteParamtypes): (data?: ParamData) => ParameterDecorator;
export declare const createPipesRouteParamDecorator: (paramtype: RouteParamtypes) => (data?: any, ...pipes: (Type<PipeTransform> | PipeTransform)[]) => ParameterDecorator;
