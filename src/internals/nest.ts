import {RouteParamtypes} from '@nestjs/common/enums/route-paramtypes.enum';
import {assignMetadata, ParamData, PipeTransform, RouteParamMetadata, Type} from "@nestjs/common";
import {ROUTE_ARGS_METADATA} from '@nestjs/common/constants';
import {isNil, isString} from "@nestjs/common/utils/shared.utils";

export { RouteParamtypes, PipeTransform, Type, ROUTE_ARGS_METADATA };

export function createRouteParamDecorator(paramtype: RouteParamtypes) {
  return (data?: ParamData): ParameterDecorator =>
    (target, key, index) => {
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        assignMetadata<RouteParamtypes, Record<number, RouteParamMetadata>>(
        args,
        paramtype,
        index,
        data,
        ),
        target.constructor,
        key,
      );
    };
};
  
export const createPipesRouteParamDecorator =
  (paramtype: RouteParamtypes) =>
    (
      data?: any,
      ...pipes: (Type<PipeTransform> | PipeTransform)[]
    ): ParameterDecorator =>
    (target, key, index) => {
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
      const hasParamData = isNil(data) || isString(data);
      const paramData = hasParamData ? data : undefined;
      const paramPipes = hasParamData ? pipes : [data, ...pipes];
  
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        assignMetadata(args, paramtype, index, paramData, ...paramPipes),
        target.constructor,
        key,
      );
    };