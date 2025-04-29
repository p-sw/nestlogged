import {
  Injectable,
  Controller,
  ControllerOptions,
  ScopeOptions,
} from '@nestjs/common';
import { RevRequestMethod } from './utils';
import { LoggedRouteBuild, LoggedFunctionBuild } from './methods';
import { logger } from '../internals/utils';
import { overrideBuild } from './override';

/**
 * @internal
 */
export function LoggedInjectable(oB: typeof overrideBuild = overrideBuild) {
  return function LoggedInjectable(
    options?: ScopeOptions & { verbose?: boolean },
  ) {
    return (target: any) => {
      const methods = Object.getOwnPropertyNames(target.prototype);

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof target.prototype[method] === 'function'
        ) {
          if (options && options.verbose)
            logger.log(`LoggedFunction applied to ${target.name}.${method}`);
          LoggedFunctionBuild(oB)()(target.prototype, method, {
            value: target.prototype[method],
          });
        }
      });

      Injectable(options)(target);
    };
  };
}

/**
 * @internal
 */
export function LoggedController(oB: typeof overrideBuild = overrideBuild) {
  function LoggedController(): (target: any) => void;
  function LoggedController(prefix: string | string[]): (target: any) => void;
  function LoggedController(
    options: ControllerOptions & { verbose?: boolean },
  ): (target: any) => void;
  function LoggedController(param?: any): (target: any) => void {
    return (target: any) => {
      const methods = Object.getOwnPropertyNames(target.prototype);

      let verbose =
        typeof param === 'object' && Object.keys(param).includes('verbose')
          ? param.verbose
          : false;

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof target.prototype[method] === 'function'
        ) {
          if (verbose) {
            const path = Reflect.getMetadata('path', target.prototype[method]);
            const httpMethod = Reflect.getMetadata(
              'method',
              target.prototype[method],
            );
            console.log(
              `LoggedRoute applied to ${target.name}.${method} (${RevRequestMethod[httpMethod]} ${path})`,
            );
          }
          LoggedRouteBuild(oB)()(target.prototype, method, {
            value: target.prototype[method],
          });
        }
      });

      Controller(param)(target);
    };
  }

  return LoggedController;
}
