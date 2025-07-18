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

export const scopedLoggerKey = Symbol('nestlogged-scopedLogger');
export const loggedParamKey = Symbol('nestlogged-loggedParam');
export const returnsKey = Symbol('nestlogged-returns');
export const ifThrowsKey = Symbol('nestlogged-ifThrows');
export const ifReturnsKey = Symbol('nestlogged-ifReturns');

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
  Reflect.defineMetadata(scopedLoggerKey, parameterIndex, target, propertyKey);
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
      Reflect.getOwnMetadata(loggedParamKey, target, propertyKey) || [];

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
      loggedParamKey,
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

/**
 * @deprecated LoggedParam integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
export function LoggedParam(): LoggedParamReturns;
/**
 * @deprecated LoggedParam integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
export function LoggedParam(...pipes: Pipe[]): LoggedParamReturns;
/**
 * @deprecated LoggedParam integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
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

/**
 * @deprecated LoggedQuery integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
export function LoggedQuery(): LoggedParamReturns;
/**
 * @deprecated LoggedQuery integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
export function LoggedQuery(...pipes: Pipe[]): LoggedParamReturns;
/**
 * @deprecated LoggedQuery integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
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

/**
 * @deprecated LoggedBody integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
export function LoggedBody(): LoggedParamReturns;
/**
 * @deprecated LoggedBody integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
export function LoggedBody(...pipes: Pipe[]): LoggedParamReturns;
/**
 * @deprecated LoggedBody integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
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

/**
 * @deprecated LoggedHeaders integrates with NestJS parameter decorators and may cause conflicts. Use @Logged decorator instead for parameter logging.
 */
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
/**
 * @deprecated use {@link IfReturns} instead
 */
export function Returns(name: Each): MethodDecorator;
/**
 * Enables fallback of {@link IfReturns}.
 */
export function Returns(enableFallback?: boolean);
export function Returns(
  name?: string | Each | boolean,
  options?: IncludeExcludePath,
) {
  return <T>(
    _target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T>,
  ) => {
    if (typeof name === 'undefined' || typeof name === 'boolean') {
      const fallback = typeof name === 'boolean' ? name : true;
      if (!_key || !descriptor) {
        // class decorator
        const methods = Object.getOwnPropertyNames(_target.prototype);
        methods.forEach((method) => {
          if (
            method !== 'constructor' &&
            typeof _target.prototype[method] === 'function'
          ) {
            // check if metadata already set to false
            // if false, ignore
            const existingMetadata = Reflect.getOwnMetadata(
              returnsKey,
              _target.prototype,
              method,
            );
            if (existingMetadata === false) return;

            Reflect.defineMetadata(
              returnsKey,
              fallback,
              _target.prototype,
              method,
            );
          }
        });
      } else {
        // method decorator
        Reflect.defineMetadata(returnsKey, fallback, _target, _key);
      }
    } else {
      console.warn(
        'nestlogged: Returns decorator for logging returned values is deprecated. This will be ignored. Use IfReturns instead.',
      );
    }
  };
}

export function IfReturns<T>(
  ifReturns: (returns: unknown) => returns is T,
  transformer: (returns: T) => object,
) {
  return <T>(
    _target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T>,
  ) => {
    function addMetadata(target: any, key: string | symbol) {
      const existingIfReturnsData: IfReturnsReflectData[] =
        Reflect.getOwnMetadata(ifReturnsKey, target, key) || [];

      existingIfReturnsData.push({ ifReturns, transformer });

      Reflect.defineMetadata(ifReturnsKey, existingIfReturnsData, target, key);
    }

    if (!_key || !descriptor) {
      // class decorator
      const methods = Object.getOwnPropertyNames(_target.prototype);

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof _target.prototype[method] === 'function'
        ) {
          addMetadata(_target.prototype, method);
        }
      });
    } else {
      // method decorator
      addMetadata(_target, _key);
    }
  };
}

export function IfThrows<E extends Error>(
  error: new (...args: any[]) => E,
  transformer: (error: E) => string | object,
) {
  return <T>(
    _target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<T>,
  ) => {
    function addMetadata(target: any, key: string | symbol) {
      const existingIfThrowsData: IfThrowsReflectData[] =
        Reflect.getOwnMetadata(ifThrowsKey, target, key) || [];

      existingIfThrowsData.push({ error, transformer });

      Reflect.defineMetadata(ifThrowsKey, existingIfThrowsData, target, key);
    }

    if (!_key || !descriptor) {
      // class decorator
      const methods = Object.getOwnPropertyNames(_target.prototype);

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof _target.prototype[method] === 'function'
        ) {
          addMetadata(_target.prototype, method);
        }
      });
    } else {
      // method decorator
      addMetadata(_target, _key);
    }
  };
}
