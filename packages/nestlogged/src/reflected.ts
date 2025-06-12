import {
  RouteParamtypes,
  Type,
  PipeTransform,
  createPipesRouteParamDecorator,
  createRouteParamDecorator,
} from './internals/nest';
import { isEach } from './utils';

export type Path = string;
export type Paths = Path[];
export interface PathTree {
  [key: string]: PathTree | null;
}

export function pathsToPathTree(paths: string[]): PathTree {
  const tree: PathTree = {};

  paths.forEach((path) => {
    const segments = path.split('.');
    let current = tree;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i === segments.length - 1) {
        current[segment] = null;
      } else {
        if (!(segment in current)) {
          current[segment] = {};
        }
        current = current[segment] as PathTree;
      }
    }
  });

  return tree;
}

export interface IncludeExcludePath {
  includePath?: Paths;
  excludePath?: Paths;
}

export interface IncludeExcludePathTree {
  includePathTree?: PathTree;
  excludePathTree?: PathTree;
}

export type Each = Record<string, Path>;

export type LoggedParamReflectData = { index: number } & (
  | {
      name: string;
      includePathTree?: PathTree;
      excludePathTree?: PathTree;
    }
  | {
      name: Each;
    }
);

export type ReturnsReflectData =
  | {
      name: Each;
    }
  | {
      name: string;
      includePathTree?: PathTree;
      excludePathTree?: PathTree;
    }
  | true;

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
  name: string | Each,
  options?: IncludeExcludePath,
): ParameterDecoratorType {
  return (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingLoggedParams: LoggedParamReflectData[] =
      Reflect.getOwnMetadata(loggedParam, target, propertyKey) || [];

    existingLoggedParams.push(
      isEach(name)
        ? { index: parameterIndex, name }
        : {
            index: parameterIndex,
            name,
            includePathTree: options?.includePath
              ? pathsToPathTree(options.includePath)
              : undefined,
            excludePathTree: options?.excludePath
              ? pathsToPathTree(options.excludePath)
              : undefined,
          },
    );

    Reflect.defineMetadata(
      loggedParam,
      existingLoggedParams,
      target,
      propertyKey,
    );
  };
}

export function Logged(
  name: string,
  options?: IncludeExcludePath,
): ParameterDecoratorType;
export function Logged(name: Each): ParameterDecoratorType;
export function Logged(
  name: string | Each,
  options?: IncludeExcludePath,
): ParameterDecoratorType {
  return createLoggedFunctionParam(name, options);
}

type LoggedParamReturns = typeof Logged;

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
  return (name: string | Each, options?: IncludeExcludePath) => {
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
  return (name: string | Each, options?: IncludeExcludePath) => {
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
  return (name: string | Each, options?: IncludeExcludePath) => {
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
  return (name: string | Each, options?: IncludeExcludePath) => {
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
  name: string,
  options?: IncludeExcludePath,
): MethodDecorator;
export function Returns<F extends Array<any>, R>(name: Each): MethodDecorator;
export function Returns<F extends Array<any>, R>(): MethodDecorator;
export function Returns<F extends Array<any>, R>(
  name?: string | Each,
  options?: IncludeExcludePath,
) {
  return (
    _target: any,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R> | R>,
  ) => {
    Reflect.defineMetadata(
      returns,
      typeof name === 'undefined'
        ? true
        : isEach(name)
          ? { name }
          : {
              name,
              includePathTree: options?.includePath
                ? pathsToPathTree(options.includePath)
                : undefined,
              excludePathTree: options?.excludePath
                ? pathsToPathTree(options.excludePath)
                : undefined,
            },
      descriptor.value,
    );
  };
}
