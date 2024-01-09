import {
  Logger,
  Injectable,
  Controller,
  ControllerOptions,
  ScopeOptions,
} from "@nestjs/common";
import { ScopedLogger } from "./logger";
import {
  LoggedParamReflectData,
  ReturnsReflectData,
  ScopeKeyReflectData,
  returns,
  scopeKey,
} from "./reflected";
import { loggedParam, scopedLogger } from "./reflected";
import { objectContainedLoggedSync, getItemByPathSync } from "./functions";
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
        LoggedFunction(target.prototype, method, {
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
  scopeKeys?: ScopeKeyReflectData[];
  loggedParams?: LoggedParamReflectData[];
}

function overrideBuild<F extends Array<any>, R>(
  originalFunction: (...args: F) => R,
  baseLogger: Logger,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  route?: {
    fullRoute: string;
  }
): (...args: F) => R {
  return function (...args: F): R {
    let injectedLogger: Logger = baseLogger;
    if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
      if (
        args.length <= metadatas.scopedLoggerInjectableParam ||
        !(args[metadatas.scopedLoggerInjectableParam] instanceof ScopedLogger)
      ) {
        args[metadatas.scopedLoggerInjectableParam] = new ScopedLogger(
          baseLogger,
          key,
          true,
          true,
        );
      } else {
        args[metadatas.scopedLoggerInjectableParam] = new ScopedLogger(
          args[metadatas.scopedLoggerInjectableParam],
          key,
          false
        );
      }

      injectedLogger = args[metadatas.scopedLoggerInjectableParam];
    }

    injectedLogger.log(
      `${route ? "HIT HTTP" : "CALL"} ${
        route ? `${route.fullRoute} (${key})` : key
      } ${
        metadatas.loggedParams && metadatas.loggedParams.length > 0
          ? "WITH " +
            metadatas.loggedParams.map(
              ({ name, index, include, exclude }) =>
                name +
                "=" +
                objectContainedLoggedSync(args[index], {
                  include,
                  exclude,
                })
            ).join(", ")
          : ""
      }`
    );

    try {
      const r: R = originalFunction.call(this, ...args);
      if (
        originalFunction.constructor.name === 'AsyncFunction' ||
        (typeof r === 'object' && typeof r['then'] === 'function')
      ) {
        return r['then']((r: any) => {
          const resultLogged = Array.isArray(returnsData)
            ? typeof r === "object"
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

          injectedLogger.log(
            route
              ? `RETURNED HTTP ${route.fullRoute} (${key}) ${resultLogged}`
              : `RETURNED ${key} ${resultLogged}`
          );
          return r;
        })
      } else {
        const resultLogged = Array.isArray(returnsData)
          ? typeof r === "object"
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

        injectedLogger.log(
          route
            ? `RETURNED HTTP ${route.fullRoute} (${key}) ${resultLogged}`
            : `RETURNED ${key} ${resultLogged}`
        );
        return r;
      }
    } catch (e) {
      injectedLogger.error(
        `WHILE ${route ? `HTTP ${route.fullRoute} (${key})` : key} ERROR ${e}`
      );
      throw e;
    }
  };
}

export function LoggedFunction<F extends Array<any>, R>(
  _target: any,
  key: string,
  descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R> | R>
) {
  loggerInit(_target);

  const logger: Logger = _target.logger;

  const fn = descriptor.value;

  if (!fn || typeof fn !== "function") {
    logger.warn(
      `LoggedFunction decorator applied to non-function property: ${key}`
    );
    return;
  }

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

  const scopeKeys: ScopeKeyReflectData[] = Reflect.getOwnMetadata(
    scopeKey,
    _target,
    key
  );

  const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
    returns,
    fn
  );

  const overrideFunction = overrideBuild(
    fn,
    logger,
    {
      scopedLoggerInjectableParam,
      loggedParams,
      scopeKeys,
    },
    key,
    returnsData
  );

  _target[key] = overrideFunction;
  descriptor.value = overrideFunction;

  all.forEach(([k, v]) => {
    Reflect.defineMetadata(k, v, _target[key]);
    Reflect.defineMetadata(k, v, descriptor.value);
  });
}

export function LoggedRoute<F extends Array<any>, R>(route?: string) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R> | R>
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

    const all = Reflect.getMetadataKeys(fn).map((k) => [
      k,
      Reflect.getMetadata(k, fn),
    ]);

    const httpPath: string = Reflect.getMetadata("path", fn);
    const httpMethod: RequestMethod = Reflect.getMetadata("method", fn);

    const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${
      RevRequestMethod[httpMethod]
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

    const scopeKeys: ScopeKeyReflectData[] = Reflect.getOwnMetadata(
      scopeKey,
      _target,
      key
    );

    const returnsData: ReturnsReflectData[] | true = Reflect.getOwnMetadata(
      returns,
      fn
    );

    const overrideFunction = overrideBuild(
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams,
        scopeKeys,
      },
      key,
      returnsData,
      {
        fullRoute,
      }
    );

    _target[key] = overrideFunction;
    descriptor.value = overrideFunction;

    all.forEach(([k, v]) => {
      Reflect.defineMetadata(k, v, _target[key]);
      Reflect.defineMetadata(k, v, descriptor.value);
    });
  };
}
