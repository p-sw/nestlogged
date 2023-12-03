import {
  Logger,
  Injectable,
  Controller,
  ControllerOptions,
  ScopeOptions,
} from "@nestjs/common";
import { ScopedLogger } from "./logger";
import { LoggedParamReflectData } from "./reflected";
import { loggedParam, scopedLogger } from "./reflected";
import objectContainedLogged from "./functions";

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

export function LoggedInjectable(options?: ScopeOptions) {
  return (target: any) => {
    loggerInit(target.prototype);

    const logger = target.prototype.logger;

    const methods = Object.getOwnPropertyNames(target.prototype);

    methods.forEach((method) => {
      if (
        method !== "constructor" &&
        typeof target.prototype[method] === "function"
      ) {
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
  options: ControllerOptions
): (target: any) => void;

export function LoggedController(param?: any): (target: any) => void {
  return (target: any) => {
    loggerInit(target.prototype);

    const logger = target.prototype.logger;

    const methods = Object.getOwnPropertyNames(target.prototype);

    logger.log(JSON.stringify(methods))

    methods.forEach((method) => {
      logger.log(method)
      if (
        method !== "constructor" &&
        typeof target.prototype[method] === "function"
      ) {
        logger.log(`LoggedRoute applied to ${method}`);
        LoggedRoute()(target.prototype, method, {
          value: target.prototype[method],
        });
      }
    });

    Controller(param)(target);
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

  _target[key] = async function(...args: F) {
    const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
      scopedLogger,
      _target,
      key
    );

    if (
      typeof scopedLoggerInjectableParam !== "undefined" &&
      (args.length <= scopedLoggerInjectableParam ||
        !(args[scopedLoggerInjectableParam] instanceof ScopedLogger))
    ) {
      args[scopedLoggerInjectableParam] = new ScopedLogger(logger, key);
    } else if (typeof scopedLoggerInjectableParam !== "undefined") {
      args[scopedLoggerInjectableParam] = new ScopedLogger(
        args[scopedLoggerInjectableParam],
        key
      );
    }

    const injectedLogger =
      typeof scopedLoggerInjectableParam !== "undefined"
        ? args[scopedLoggerInjectableParam]
        : logger;

    const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
      loggedParam,
      _target,
      key
    );

    injectedLogger.log(
      `CALL ${key} ${loggedParams && loggedParams.length > 0
        ? "WITH " +
        (
          await Promise.all(
            loggedParams.map(
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
      const r: R = await fn.call(this, ...args);
      injectedLogger.log(`RETURNED ${key}`);
      return r;
    } catch (e) {
      injectedLogger.error(`WHILE ${key} ERROR ${e}`);
      throw e;
    }
  };
}

export function LoggedRoute<F extends Array<any>, R>(route?: string) {
  return (
    _target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>
  ) => {
    loggerInit(_target);

    const logger = _target.logger;

    let fullRoute = `${_target.constructor.name}/`;
    const fn = descriptor.value;

    if (!fn || typeof fn !== "function") {
      logger.warn(
        `LoggedRoute decorator applied to non-function property: ${key}`
      );
      return;
    }

    _target[key] = async function(...args: F) {
      const scopedLoggerInjectableParam: number = Reflect.getOwnMetadata(
        scopedLogger,
        _target,
        key
      );

      fullRoute += route || Reflect.getMetadata("path", fn);

      if (
        typeof scopedLoggerInjectableParam !== "undefined" &&
        (args.length <= scopedLoggerInjectableParam ||
          !(args[scopedLoggerInjectableParam] instanceof ScopedLogger))
      ) {
        args[scopedLoggerInjectableParam] = new ScopedLogger(logger, fullRoute);
      }

      const injectedLogger =
        typeof scopedLoggerInjectableParam !== "undefined"
          ? args[scopedLoggerInjectableParam]
          : logger;

      const loggedParams: LoggedParamReflectData[] = Reflect.getOwnMetadata(
        loggedParam,
        _target,
        key
      );

      injectedLogger.log(
        `HIT HTTP ${fullRoute} (${key}) ${loggedParams && loggedParams.length > 0
          ? "WITH " +
          (
            await Promise.all(
              loggedParams.map(
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
        const r: R = await fn.call(this, ...args);
        injectedLogger.log(`RETURNED RESPONSE ${fullRoute} (${key})`);
        return r;
      } catch (e) {
        injectedLogger.error(`WHILE HTTP ${fullRoute} (${key}) ERROR ${e}`);
        throw e;
      }
    };
  };
}
