import {
  Logger,
  LogLevel,
  Injectable,
  Controller,
  ControllerOptions,
  ScopeOptions,
  ExecutionContext,
} from "@nestjs/common";
import { ScopedLogger } from "./logger";
import {
  LoggedParamReflectData,
  ReturnsReflectData,
  returns,
  nestLoggedMetadata,
  loggedParam,
  scopedLogger,
  createRouteParamDecorator
} from "./reflected";
import { imObjectContainedLogSync, getItemByPathSync } from "./internals/utils";
import { RequestMethod } from "@nestjs/common";

const RevRequestMethod = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "ALL",
  "OPTIONS",
  "HEAD",
  "SEARCH",
];

function loggerInit(_target: any) {
  if (!Object.getOwnPropertyNames(_target).includes("logger")) {
    const newTargetLogger = new Logger(_target.constructor.name);
    newTargetLogger.log("Logger Initialized.");
    Object.defineProperty(_target, "logger", {
      writable: false,
      enumerable: false,
      configurable: false,
      value: newTargetLogger,
    });
  }
}

export function LoggedInjectable(
  options?: ScopeOptions & { verbose?: boolean }
) {
  return (target: any) => {
    loggerInit(target.prototype);

    const logger = target.prototype.logger;

    const methods = Object.getOwnPropertyNames(target.prototype);

    methods.forEach((method) => {
      if (
        method !== "constructor" &&
        typeof target.prototype[method] === "function"
      ) {
        if (options && options.verbose)
          logger.log(`LoggedFunction applied to ${method}`);
        LoggedFunction()(target.prototype, method, {
          value: target.prototype[method],
        });
      }
    });

    Injectable(options)(target);
  };
}

export function LoggedController(): (target: any) => void;
export function LoggedController(
  prefix: string | string[]
): (target: any) => void;
export function LoggedController(
  options: ControllerOptions & { verbose?: boolean }
): (target: any) => void;

export function LoggedController(param?: any): (target: any) => void {
  return (target: any) => {
    loggerInit(target.prototype);

    const logger = target.prototype.logger;

    const methods = Object.getOwnPropertyNames(target.prototype);

    let verbose =
      typeof param === "object" && Object.keys(param).includes("verbose")
        ? param.verbose
        : false;

    methods.forEach((method) => {
      if (
        method !== "constructor" &&
        typeof target.prototype[method] === "function"
      ) {
        if (verbose) {
          const path = Reflect.getMetadata("path", target.prototype[method]);
          const httpMethod = Reflect.getMetadata(
            "method",
            target.prototype[method]
          );
          logger.log(
            `LoggedRoute applied to ${method} (${RevRequestMethod[httpMethod]} ${path})`
          );
        }
        LoggedRoute()(target.prototype, method, {
          value: target.prototype[method],
        });
      }
    });

    Controller(param)(target);
  };
}

interface FunctionMetadata {
  scopedLoggerInjectableParam?: number;
  loggedParams?: LoggedParamReflectData[];
}

interface OverrideBuildOptions {
  callLogLevel: LogLevel | 'skip';
  returnLogLevel: LogLevel | 'skip';
  errorLogLevel: LogLevel | 'skip';
  /** @deprecated use `callLogLevel: 'skip'` instead */
  skipCallLog: boolean;
  /** @deprecated use `returnLogLevel: 'skip'` instead */
  skipReturnLog: boolean;
  /** @deprecated use `errorLogLevel: 'skip'` instead */
  skipErrorLog: boolean;
}

const defaultOverrideBuildOptions: OverrideBuildOptions = {
  callLogLevel: 'log',
  returnLogLevel: 'log',
  errorLogLevel: 'error',
  skipCallLog: false,
  skipReturnLog: false,
  skipErrorLog: false,
}

class LoggedMetadata {
  options: OverrideBuildOptions

  constructor(options?: Partial<OverrideBuildOptions>) {
    this.options = {
      ...defaultOverrideBuildOptions,
      ...(options ?? {}),
    }
  }

  updateOption(options: Partial<OverrideBuildOptions>) {
    this.options = {
      ...this.options,
      ...options
    }
  }
}

type BuildType = 'route' | 'function' | 'guard' | 'interceptor' | 'middleware';

const callLogIdentifyMessageDictionary: Record<BuildType, string> = {
  route: 'ENDPOINT',
  function: 'FUNCTION',
  guard: 'GUARD',
  interceptor: 'INTERCEPTOR',
  middleware: 'MIDDLEWARE',
}

function createCallLogIdentifyMessage(message: 'HIT' | 'RETURNED' | 'ERROR', type: BuildType, key?: string, route?: string) {
  if (message === 'ERROR')
    return `ERROR WHILE ${callLogIdentifyMessageDictionary[type]} ${key} (${route}): `;

  if (type === 'guard' || type === 'interceptor' || type === 'middleware' || type === 'route')
    return `${message} ${callLogIdentifyMessageDictionary[type]} ${key} (${route})`
  if (type === 'function')
    return `${message} ${callLogIdentifyMessageDictionary[type]} ${key}`;

  return `${message} ${callLogIdentifyMessageDictionary[type]}`;
}

export const REQUEST_LOG_ID = '__nestlogged_request_log_id__';

function overrideBuild<F extends Array<any>, R>(
  type: 'route',
  originalFunction: (...args: F) => R,
  baseLogger: Logger,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  logged: LoggedMetadata,
  route: string,
): (...args: F) => R;
function overrideBuild<F extends Array<any>, R>(
  type: 'function' | 'guard' | 'interceptor' | 'middleware',
  originalFunction: (...args: F) => R,
  baseLogger: Logger,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  logged: LoggedMetadata,
): (...args: F) => R;
function overrideBuild<F extends Array<any>, R>(
  type: BuildType,
  originalFunction: (...args: F) => R,
  baseLogger: Logger,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  logged: LoggedMetadata,
  route?: string,
): (...args: F) => R {
  return function (...args: F): R {
    // Creating ScopedLogger
    let injectedLogger: Logger = baseLogger;
    if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
      if (type === 'function') {
        if (
          args.length <= metadatas.scopedLoggerInjectableParam ||
          !(args[metadatas.scopedLoggerInjectableParam] instanceof ScopedLogger)
        ) {
          args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromRoot(baseLogger, key);
        } else {
          args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromSuper(baseLogger, args[metadatas.scopedLoggerInjectableParam], key);
        }
      } else {
        // special, can access to request object
        if (type === 'guard' || type === 'interceptor') {
          // args[0] == ExecutionContext
          const ctx = (args[0] as ExecutionContext);
          if (ctx.getType() !== 'http') {
            injectedLogger.error('Cannot inject logger: Request type is not http');
          } else {
            let req = ctx.switchToHttp().getRequest();
            if (req[REQUEST_LOG_ID] === undefined) {
              req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
            }
            args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromRoot(baseLogger, key, req[REQUEST_LOG_ID]);
          }
        } else if (type === 'middleware') {
          let req = args[0];
          if (req[REQUEST_LOG_ID] === undefined) {
            req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
          }
          args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromRoot(baseLogger, key, req[REQUEST_LOG_ID]);
        } else if (type === 'route') {
          // args[metadatas.scopedLoggerInjectableParam] is now Request object, thanks to code in @LoggedRoute!!!!
          let req = args[metadatas.scopedLoggerInjectableParam];
          if (req[REQUEST_LOG_ID] === undefined) {
            req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
          }
          args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromRoot(baseLogger, key, req[REQUEST_LOG_ID]);
        }
      }

      injectedLogger = args[metadatas.scopedLoggerInjectableParam];
    }

    // If this is ExecutionContext based function (e.g. Guard, Interceptor) get Request from Context
    if (type === 'guard' || type === 'interceptor') {
      const context = args[0] as ExecutionContext;
      if (context.getType() === 'http') {
        const req = context.switchToHttp().getRequest();
        route = /* supporting FastifyRequest */ req.raw ? req.raw.url : req.url;
      }
    }

    // Start Log
    if (logged.options.callLogLevel !== 'skip') {
      const callLogIdentifyMessage = 
        type === 'middleware' || type === 'guard' || type === 'interceptor' || type === 'route'
          ? createCallLogIdentifyMessage('HIT', type, key, route)
          : createCallLogIdentifyMessage('HIT', type, key);
      injectedLogger[logged.options.callLogLevel](
        `${callLogIdentifyMessage} ${metadatas.loggedParams && metadatas.loggedParams.length > 0
          ? "WITH " +
          metadatas.loggedParams.map(
            ({ name, index, include, exclude }) =>
              name +
              "=" +
              imObjectContainedLogSync(args[index], {
                include,
                exclude,
              })
          ).join(", ")
          : ""
        }`
      );
    }

    try {
      const r: R = originalFunction.call(this, ...args); // Try to call original function

      // Return Log
      if (logged.options.returnLogLevel !== 'skip') {
        if (
          originalFunction.constructor.name === 'AsyncFunction' ||
          (r && typeof r === 'object' && typeof r['then'] === 'function')
        ) {
          return r['then']((r: any) => {
            const resultLogged = Array.isArray(returnsData)
              ? typeof r === "object" && r !== null
                ? "WITH " +
                returnsData.map(({ name, path }) => {
                  const value = getItemByPathSync(r, path);

                  return value !== undefined ? `${name}=${value}` : "";
                })
                  .filter((v) => v.length > 0)
                  .join(", ")
                : ""
              : typeof returnsData === 'string'
                ? "WITH " + returnsData + "=" + typeof r === "object" ? JSON.stringify(r) : r
                : returnsData
                  ? typeof r === "object"
                    ? "WITH " + JSON.stringify(r)
                    : "WITH " + r
                  : "";

            injectedLogger[logged.options.returnLogLevel](`${createCallLogIdentifyMessage('RETURNED', type, key, route)} ${resultLogged}`);
            return r;
          })
        } else {
          const resultLogged = Array.isArray(returnsData)
            ? typeof r === "object" && r !== null
              ? "WITH " +
              returnsData.map(({ name, path }) => {
                const value = getItemByPathSync(r, path);

                return value !== undefined ? `${name}=${value}` : "";
              })
                .filter((v) => v.length > 0)
                .join(", ")
              : ""
            : typeof returnsData === 'string'
              ? "WITH " + returnsData + "=" + typeof r === "object" ? JSON.stringify(r) : r
              : returnsData
                ? typeof r === "object"
                  ? "WITH " + JSON.stringify(r)
                  : "WITH " + r
                : "";

          injectedLogger[logged.options.returnLogLevel](`${createCallLogIdentifyMessage('RETURNED', type, key, route)} ${resultLogged}`);
          return r;
        }
      } else {
        return r;
      }
    } catch (e) {
      // Error Log
      if (logged.options.errorLogLevel !== 'skip') {
        injectedLogger[logged.options.errorLogLevel](`${createCallLogIdentifyMessage('ERROR', type, key, route)} ${e}`);
      }
      throw e;
    }
  }
}

export function LoggedFunction<F extends Array<any>, R>(
  options?: Partial<OverrideBuildOptions>
) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => R | Promise<R>>
  ) => {
    loggerInit(_target);

    const logger: Logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn !== "function") {
      logger.warn(
        `LoggedFunction decorator applied to non-function property: ${key}`
      );
      return;
    }

    const logMetadata: LoggedMetadata | undefined = Reflect.getOwnMetadata(
      nestLoggedMetadata,
      _target,
      key
    )
    if (logMetadata) {
      // already applied, override instead
      logMetadata.updateOption(options)
      return
    }
    const newMetadata = new LoggedMetadata(options);

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key
    );

    const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
      loggedParam,
      _target,
      key
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn
    );

    const overrideFunction = overrideBuild(
      'function',
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams,
      },
      key,
      returnsData,
      newMetadata,
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    Reflect.defineMetadata(
      nestLoggedMetadata,
      newMetadata,
      _target,
      key
    )
    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  }
}

export function LoggedRoute<F extends Array<any>, R>(route?: string, options?: Partial<OverrideBuildOptions>) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => R>
  ) => {
    loggerInit(_target);

    const logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn !== "function") {
      logger.warn(
        `LoggedRoute decorator applied to non-function property: ${key}`
      );
      return;
    }

    const logMetadata: LoggedMetadata | undefined = Reflect.getOwnMetadata(
      nestLoggedMetadata,
      _target,
      key
    )
    if (logMetadata) {
      // already applied, override instead
      logMetadata.updateOption(options)
      return
    }
    const newMetadata = new LoggedMetadata(options);

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const httpPath: string = Reflect.getMetadata("path", fn);
    const httpMethod: RequestMethod = Reflect.getMetadata("method", fn);

    const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${RevRequestMethod[httpMethod]
      }]`;

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key
    );
    // if @InjectLogger exists, fake nestjs as it is @Req()
    if (scopedLoggerInjectableParam !== undefined) {
      createRouteParamDecorator(0)()(_target, key, scopedLoggerInjectableParam);
    }

    const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
      loggedParam,
      _target,
      key
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn
    );

    const overrideFunction = overrideBuild(
      'route',
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams,
      },
      key,
      returnsData,
      newMetadata,
      fullRoute,
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    Reflect.defineMetadata(
      nestLoggedMetadata,
      newMetadata,
      _target,
      key
    )
    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  };
}

export function LoggedGuard<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>
  ) => {
    loggerInit(_target);

    const logger: Logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn!== "function") {
      logger.warn(
        `LoggedGuard decorator applied to non-function property: ${key}`
      );
      return;
    }

    const logMetadata: LoggedMetadata | undefined = Reflect.getOwnMetadata(
      nestLoggedMetadata,
      _target,
      key
    )
    if (logMetadata) {
      // already applied, override instead
      logMetadata.updateOption(options)
      return
    }
    const newMetadata = new LoggedMetadata(options);

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn
    );

    const overrideFunction = overrideBuild(
      'guard',
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams: [],
      },
      _target.constructor.name,
      returnsData,
      newMetadata,
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    Reflect.defineMetadata(
      nestLoggedMetadata,
      newMetadata,
      _target,
      key
    )
    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  }
}

export function LoggedInterceptor<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>
  ) => {
    loggerInit(_target);

    const logger: Logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn!== "function") {
      logger.warn(
        `LoggedInterceptor decorator applied to non-function property: ${key}`
      );
      return;
    }

    const logMetadata: LoggedMetadata | undefined = Reflect.getOwnMetadata(
      nestLoggedMetadata,
      _target,
      key
    )
    if (logMetadata) {
      // already applied, override instead
      logMetadata.updateOption(options)
      return
    }
    const newMetadata = new LoggedMetadata(options);

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn
    );

    const overrideFunction = overrideBuild(
      'interceptor',
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams: [],
      },
      _target.constructor.name,
      returnsData,
      newMetadata,
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    Reflect.defineMetadata(
      nestLoggedMetadata,
      newMetadata,
      _target,
      key
    )
    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  }
}

export function LoggedMiddleware<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>
  ) => {
    loggerInit(_target);

    const logger: Logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn!== "function") {
      logger.warn(
        `LoggedMiddleware decorator applied to non-function property: ${key}`
      );
      return;
    }

    const logMetadata: LoggedMetadata | undefined = Reflect.getOwnMetadata(
      nestLoggedMetadata,
      _target,
      key
    )
    if (logMetadata) {
      // already applied, override instead
      logMetadata.updateOption(options)
      return
    }
    const newMetadata = new LoggedMetadata(options);

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn
    );

    const overrideFunction = overrideBuild(
      'middleware',
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams: [],
      },
      _target.constructor.name,
      returnsData,
      newMetadata,
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    Reflect.defineMetadata(
      nestLoggedMetadata,
      newMetadata,
      _target,
      key
    )
    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  }
}