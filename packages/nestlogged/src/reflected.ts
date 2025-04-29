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

export interface IncludeExcludePath {
  includePath?: Paths;
  excludePath?: Paths;
}

export type Each = Record<string, Path>;

export type LoggedParamReflectData = { index: number } & (
  | {
      name: string;
      include?: Paths;
      exclude?: Paths;
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
      include?: Paths;
      exclude?: Paths;
    };

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
            include: options?.includePath,
            exclude: options?.excludePath,
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
export function Returns<F extends Array<any>, R>(
  name: string | Each,
  options?: IncludeExcludePath,
) {
  return (
    _target: any,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R> | R>,
  ) => {
    Reflect.defineMetadata(
      returns,
      isEach(name)
        ? { name }
        : {
            name,
            include: options?.includePath,
            exclude: options?.excludePath,
          },
      descriptor.value,
    );
  };
}
