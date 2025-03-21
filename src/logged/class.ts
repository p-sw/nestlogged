import {
  Injectable,
  Controller,
  ControllerOptions,
  ScopeOptions,
} from "@nestjs/common";
import {
  loggerInit,
  RevRequestMethod
} from './utils';
import {
  LoggedRoute,
  LoggedFunction
} from "./methods";

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