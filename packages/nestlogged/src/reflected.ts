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

export const scopedLogger = Symbol('nestlogged-scopedLogger');
export const loggedParam = Symbol('nestlogged-loggedParam');
export const returns = Symbol('nestlogged-returns');
export const ifThrows = Symbol('nestlogged-ifThrows');
export const ifReturns = Symbol('nestlogged-ifReturns');

export type IfReturnsReflectData = {
  ifReturns: (returns: unknown) => boolean;
  transformer: (returns: unknown) => object;
};

export type IfThrowsReflectData = {
  error: unknown;
  transformer: (error: unknown) => string | object;
};

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
    return (
      target: any,
      propertyKey: string | symbol,
      parameterIndex: number,
    ) => {
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
    return (
      target: any,
      propertyKey: string | symbol,
      parameterIndex: number,
    ) => {
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
    return (
      target: any,
      propertyKey: string | symbol,
      parameterIndex: number,
    ) => {
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
    return (
      target: any,
      propertyKey: string | symbol,
      parameterIndex: number,
    ) => {
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

/**
 * @deprecated use {@link IfReturns} instead
 */
export function Returns(
  name: string,
  options?: IncludeExcludePath,
): MethodDecorator;
export function Returns(name: Each): MethodDecorator;
export function Returns(): MethodDecorator;
export function Returns(
  name?: string | Each,
  options?: IncludeExcludePath,
): MethodDecorator {
  return <T>(
    _target: any,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) => {
    console.warn(
      'nestlogged: Returns decorator is deprecated. This will be ignored. Use IfReturns instead.',
    );

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

export function IfReturns<T>(
  ifReturns: (returns: unknown) => returns is T,
  transformer: (returns: T) => object,
): MethodDecorator | ClassDecorator {
  return <T>(
    _target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T>,
  ) => {
    function addMetadata() {
      const existingIfReturnsData: IfReturnsReflectData[] =
        Reflect.getOwnMetadata(ifReturns, _target, _key) || [];

      existingIfReturnsData.push({ ifReturns, transformer });

      Reflect.defineMetadata(ifReturns, existingIfReturnsData, _target, _key);
    }

    if (!_key || !descriptor) {
      // class decorator
      const methods = Object.getOwnPropertyNames(_target.prototype);

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof _target.prototype[method] === 'function'
        ) {
          addMetadata();
        }
      });
    } else {
      // method decorator
      addMetadata();
    }
  };
}

export function IfThrows<E extends Error>(
  error: E,
  transformer: (error: E) => string | object,
): MethodDecorator | ClassDecorator {
  return <T>(
    _target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T>,
  ) => {
    function addMetadata() {
      const existingIfThrowsData: IfThrowsReflectData[] =
        Reflect.getOwnMetadata(ifThrows, _target, _key) || [];

      existingIfThrowsData.push({ error, transformer });

      Reflect.defineMetadata(ifThrows, existingIfThrowsData, _target, _key);
    }

    if (!_key || !descriptor) {
      // class decorator
      const methods = Object.getOwnPropertyNames(_target.prototype);

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof _target.prototype[method] === 'function'
        ) {
          addMetadata();
        }
      });
    } else {
      // method decorator
      addMetadata();
    }
  };
}
