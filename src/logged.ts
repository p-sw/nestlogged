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
  scopedLogger
} from "./reflected";
import { imObjectContainedLogSync, getItemByPathSync } from "./functions";
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

type BuildType = 'route' | 'function' | 'guard' | 'interceptor';

const callLogIdentifyMessageDictionary: Record<BuildType, string> = {
  route: 'HIT HTTP',
  function: 'CALL',
  guard: 'HIT GUARD',
  interceptor: 'HIT INTERCEPTOR'
}

function createCallLogIdentifyMessage(type: 'route' | 'guard' | 'interceptor', key: string, route: string)
function createCallLogIdentifyMessage(type: 'function', key: string)
function createCallLogIdentifyMessage(type: BuildType, key: string, route?: string) {
  return `${callLogIdentifyMessageDictionary[type]} ${type === 'route' ? `${route} (${key})` : type === 'guard' ? `${route}` : key}`
}

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
  type: 'function' | 'guard' | 'interceptor',
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
      if (
        args.length <= metadatas.scopedLoggerInjectableParam ||
        !(args[metadatas.scopedLoggerInjectableParam] instanceof ScopedLogger)
      ) {
        args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromRoot(baseLogger, key);
      } else {
        args[metadatas.scopedLoggerInjectableParam] = ScopedLogger.fromSuper(baseLogger, args[metadatas.scopedLoggerInjectableParam], key);
      }

      injectedLogger = args[metadatas.scopedLoggerInjectableParam];
    }

    // If this is ExecutionContext based function (e.g. Guard, Interceptor) get Request from Context
    if (type === 'guard') {
      const context = args[0] as ExecutionContext;
      if (context.getType() === 'http') {
        const req = context.switchToHttp().getRequest();
        route = new URL(<string>(/* supporting FastifyRequest */ req.raw ? req.raw.url : req.url)).pathname;
      }
    }

    // Start Log
    if (logged.options.callLogLevel !== 'skip') {
      const callLogIdentifyMessage = type === 'route' || type === 'guard' || type === 'interceptor' ? createCallLogIdentifyMessage(type, key, route) : createCallLogIdentifyMessage(type, key)
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

            injectedLogger[logged.options.returnLogLevel](
              route
                ? `RETURNED HTTP ${route} (${key}) ${resultLogged}`
                : `RETURNED ${key} ${resultLogged}`
            );
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

          injectedLogger[logged.options.returnLogLevel](
            route
              ? `RETURNED HTTP ${route} (${key}) ${resultLogged}`
              : `RETURNED ${key} ${resultLogged}`
          );
          return r;
        }
      } else {
        return r;
      }
    } catch (e) {
      // Error Log
      if (logged.options.errorLogLevel !== 'skip') {
        injectedLogger[logged.options.errorLogLevel](
          `WHILE ${route ? `HTTP ${route} (${key})` : key} ERROR ${e}`
        );
      }
      throw e;
    }
  };
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