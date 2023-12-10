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
  ScopeKeyReflectData,
  forceScopeKey,
  scopeKey,
} from "./reflected";
import { loggedParam, scopedLogger } from "./reflected";
import objectContainedLogged from "./functions";
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
        const all = Reflect.getMetadataKeys(target.prototype[method]).map(
          (k) => [k, Reflect.getMetadata(k, target.prototype[method])]
        );
        if (options && options.verbose)
          logger.log(`LoggedFunction applied to ${method}`);
        LoggedFunction(target.prototype, method, {
          value: target.prototype[method],
        });
        all.forEach(([k, v]) =>
          Reflect.defineMetadata(k, v, target.prototype[method])
        );
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
        const path = Reflect.getMetadata("path", target.prototype[method]);
        const httpMethod = Reflect.getMetadata(
          "method",
          target.prototype[method]
        );
        const all = Reflect.getMetadataKeys(target.prototype[method]).map(
          (k) => [k, Reflect.getMetadata(k, target.prototype[method])]
        );
        if (verbose)
          logger.log(
            `LoggedRoute applied to ${method} (${RevRequestMethod[httpMethod]} ${path})`
          );
        LoggedRoute()(target.prototype, method, {
          value: target.prototype[method],
        });
        all.forEach(([k, v]) =>
          Reflect.defineMetadata(k, v, target.prototype[method])
        );
      }
    });

    Controller(param)(target);
  };
}

interface FunctionMetadata {
  scopedLoggerInjectableParam?: number;
  scopeKeys?: ScopeKeyReflectData[];
  shouldScoped?: boolean;
  loggedParams?: LoggedParamReflectData[];
}

function overrideBuild<F extends Array<any>, R>(
  originalFunction: (...args: F) => Promise<R>,
  baseLogger: Logger,
  metadatas: FunctionMetadata,
  key: string,
  route?: {
    fullRoute: string;
  }
) {
  return async function (...args: F) {
    let injectedLogger: Logger = baseLogger;
    if (typeof metadatas.scopedLoggerInjectableParam !== "undefined") {
      if (
        args.length <= metadatas.scopedLoggerInjectableParam ||
        !(args[metadatas.scopedLoggerInjectableParam] instanceof ScopedLogger)
      ) {
        args[metadatas.scopedLoggerInjectableParam] = new ScopedLogger(
          baseLogger,
          key
        );
      } else {
        args[metadatas.scopedLoggerInjectableParam] = new ScopedLogger(
          args[metadatas.scopedLoggerInjectableParam],
          key
        );
      }

      injectedLogger = args[metadatas.scopedLoggerInjectableParam];

      if (Array.isArray(metadatas.scopeKeys)) {
        const scopeKeyResults: { error: boolean; value: string }[] =
          metadatas.scopeKeys.map((key) => {
            const argsValue = args[key.index];
            if (!key.path) {
              if (!metadatas.shouldScoped || argsValue) {
                return { error: false, value: `${key.name}=${argsValue}` };
              } else {
                return {
                  error: true,
                  value: `ScopeKey in ShouldScope cannot be falsy value (${argsValue})`,
                };
              }
            }
            try {
              const reduceResult = key.path.reduce((base, keyPath) => {
                if (
                  typeof base !== "object" ||
                  !Object.keys(base).includes(keyPath)
                )
                  throw new Error(
                    `Cannot find key ${keyPath} in ${
                      typeof base === "object" ? JSON.stringify(base) : base
                    }`
                  );
                return base[keyPath];
              }, argsValue);
              return { error: false, value: `${key.name}=${reduceResult}` };
            } catch (e) {
              return { error: true, value: e.message };
            }
          });

        const successResults = scopeKeyResults.filter((v) => v.error === false);
        if (successResults.length === 0) {
          if (metadatas.shouldScoped) {
            scopeKeyResults.forEach((v) => injectedLogger.warn(v.value));
          }
        } else {
          (injectedLogger as ScopedLogger).addScope(successResults[0].value);
        }
      }
    }

    injectedLogger.log(
      `${route ? "HIT HTTP" : "CALL"} ${
        route ? `${route.fullRoute} (${key})` : key
      } ${
        metadatas.loggedParams && metadatas.loggedParams.length > 0
          ? "WITH " +
            (
              await Promise.all(
                metadatas.loggedParams.map(
                  async ({ name, index, include, exclude }) =>
                    name +
                    "=" +
                    (await objectContainedLogged(args[index], {
                      include,
                      exclude,
                    }))
                )
              )
            ).join(", ")
          : ""
      }`
    );

    try {
      const r: R = await originalFunction.call(this, ...args);
      injectedLogger.log(
        route
          ? `RETURNED RESPONSE ${route.fullRoute} (${key})`
          : `RETURNED ${key}`
      );
      return r;
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
  descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>
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

  const shouldScoped: boolean = Reflect.getOwnMetadata(forceScopeKey, fn);

  const overrideFunction = overrideBuild(
    fn,
    logger,
    {
      scopedLoggerInjectableParam,
      loggedParams,
      scopeKeys,
      shouldScoped,
    },
    key
  );

  _target[key] = overrideFunction;
  descriptor.value = overrideFunction;
}

export function LoggedRoute<F extends Array<any>, R>(route?: string) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>
  ): [string, RequestMethod] => {
    loggerInit(_target);

    const logger = _target.logger;

    const fn = descriptor.value;

    if (!fn || typeof fn !== "function") {
      logger.warn(
        `LoggedRoute decorator applied to non-function property: ${key}`
      );
      return;
    }

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

    const shouldScoped: boolean = Reflect.getOwnMetadata(forceScopeKey, fn);

    const overrideFunction = overrideBuild(
      fn,
      logger,
      {
        scopedLoggerInjectableParam,
        loggedParams,
        scopeKeys,
        shouldScoped,
      },
      key,
      {
        fullRoute,
      }
    );
  };
}
