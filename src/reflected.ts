import {
  RouteParamtypes,
  Type,
  PipeTransform,
  createPipesRouteParamDecorator,
  createRouteParamDecorator,
} from './internals/nest';

export type Path = string | string[];
export type Paths = Path[];

export interface IncludeExcludePath {
  includePath?: Paths;
  excludePath?: Paths;
}

export interface LoggedParamReflectData {
  name: string;
  index: number;
  include?: string[];
  exclude?: string[];
}

export interface ScopeKeyReflectData {
  name: string;
  index: number;
  path?: string[];
  priority?: number;
}

export interface ReturnsReflectData {
  name: string;
  path: string;
}

export const scopedLogger = Symbol('nlogdec-scopedLogger');
export const loggedParam = Symbol('nlogdec-loggedParam');
export const returns = Symbol('nlogdec-returns');

export function InjectLogger(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number,
) {
  Reflect.defineMetadata(scopedLogger, parameterIndex, target, propertyKey);
}

type ParameterDecoratorType = (
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number,
) => void;

function createLoggedFunctionParam(
  name: string,
  options?: IncludeExcludePath,
): ParameterDecoratorType {
  return (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingLoggedParams: LoggedParamReflectData[] =
      Reflect.getOwnMetadata(loggedParam, target, propertyKey) || [];

    existingLoggedParams.push({
      name,
      index: parameterIndex,
      // If path is provided in string[] type, convert it to string path because it is used in string type
      include:
        options &&
        options.includePath &&
        options.includePath.map((v) => (Array.isArray(v) ? v.join('.') : v)),
      exclude:
        options &&
        options.excludePath &&
        options.excludePath.map((v) => (Array.isArray(v) ? v.join('.') : v)),
    });

    Reflect.defineMetadata(
      loggedParam,
      existingLoggedParams,
      target,
      propertyKey,
    );
  };
}

type LoggedParamReturns = (
  name: string,
  options?: IncludeExcludePath,
) => ParameterDecoratorType;

export const Logged: LoggedParamReturns = (name, options) =>
  createLoggedFunctionParam(name, options);

type Pipe = Type<PipeTransform> | PipeTransform;

export function LoggedParam(): LoggedParamReturns;
export function LoggedParam(...pipes: Pipe[]): LoggedParamReturns;
export function LoggedParam(
  property: string,
  ...pipes: Pipe[]
): LoggedParamReturns;
export function LoggedParam(
  property?: string | Pipe,
  ...pipes: Pipe[]
): LoggedParamReturns {
  return (name, options) => {
    return (target, propertyKey, parameterIndex) => {
      createPipesRouteParamDecorator(RouteParamtypes.PARAM)(property, ...pipes)(
        target,
        propertyKey,
        parameterIndex,
      );
      createLoggedFunctionParam(name, options)(
        target,
        propertyKey,
        parameterIndex,
      );
    };
  };
}

export function LoggedQuery(): LoggedParamReturns;
export function LoggedQuery(...pipes: Pipe[]): LoggedParamReturns;
export function LoggedQuery(
  property: string,
  ...pipes: Pipe[]
): LoggedParamReturns;
export function LoggedQuery(
  property?: string | Pipe,
  ...pipes: Pipe[]
): LoggedParamReturns {
  return (name, options) => {
    return (target, propertyKey, parameterIndex) => {
      createPipesRouteParamDecorator(RouteParamtypes.QUERY)(property, ...pipes)(
        target,
        propertyKey,
        parameterIndex,
      );

      createLoggedFunctionParam(name, options)(
        target,
        propertyKey,
        parameterIndex,
      );
    };
  };
}

export function LoggedBody(): LoggedParamReturns;
export function LoggedBody(...pipes: Pipe[]): LoggedParamReturns;
export function LoggedBody(
  property: string,
  ...pipes: Pipe[]
): LoggedParamReturns;
export function LoggedBody(
  property?: string | Pipe,
  ...pipes: Pipe[]
): LoggedParamReturns {
  return (name, options) => {
    return (target, propertyKey, parameterIndex) => {
      createPipesRouteParamDecorator(RouteParamtypes.BODY)(property, ...pipes)(
        target,
        propertyKey,
        parameterIndex,
      );

      createLoggedFunctionParam(name, options)(
        target,
        propertyKey,
        parameterIndex,
      );
    };
  };
}

export function LoggedHeaders(property?: string): LoggedParamReturns {
  return (name, options) => {
    return (target, propertyKey, parameterIndex) => {
      createRouteParamDecorator(RouteParamtypes.HEADERS)(property)(
        target,
        propertyKey,
        parameterIndex,
      );

      createLoggedFunctionParam(name, options)(
        target,
        propertyKey,
        parameterIndex,
      );
    };
  };
}

export function Returns<F extends Array<any>, R>(
  namePaths?:
    | {
        [name: string]: string;
      }
    | string,
) {
  return (
    _target: any,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R> | R>,
  ) => {
    Reflect.defineMetadata(
      returns,
      namePaths
        ? typeof namePaths === 'string'
          ? namePaths
          : Object.entries(namePaths).reduce<ReturnsReflectData[]>(
              (prev, curr) => [...prev, { name: curr[0], path: curr[1] }],
              [],
            )
        : true,
      descriptor.value,
    );
  };
}
