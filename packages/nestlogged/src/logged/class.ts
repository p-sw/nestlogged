import {
  Injectable,
  Controller,
  ControllerOptions,
  ScopeOptions,
} from '@nestjs/common';
import { RevRequestMethod } from './utils';
import { LoggedRouteBuild, LoggedFunctionBuild } from './methods';
import { logger } from '../internals/object-util';
import { overrideBuild } from './override';
import { OverrideBuildOptions } from './utils';

/**
 * @internal
 */
export function LoggedInjectable(oB: typeof overrideBuild = overrideBuild) {
  return function LoggedInjectable(
    options?: ScopeOptions & {
      /** @deprecated use logOptions.verbose instead */
      verbose?: boolean;
      logOptions?: Partial<OverrideBuildOptions> & { verbose?: boolean };
    },
  ) {
    const logOptions = options?.logOptions ?? {};
    const verbose = options?.verbose ?? logOptions.verbose ?? false;

    return (target: any) => {
      const methods = Object.getOwnPropertyNames(target.prototype);

      methods.forEach((method) => {
        if (
          method !== 'constructor' &&
          typeof target.prototype[method] === 'function'
        ) {
          if (verbose)
            logger.log(`LoggedFunction applied to ${target.name}.${method}`);
          LoggedFunctionBuild(oB)(logOptions)(target.prototype, method, {
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
  function LoggedController(
    logOptions?: Partial<OverrideBuildOptions> & { verbose?: boolean },
  ): (target: any) => void;
  function LoggedController(
    prefix: string | string[],
    logOptions?: Partial<OverrideBuildOptions> & { verbose?: boolean },
  ): (target: any) => void;
  function LoggedController(
    options: ControllerOptions & {
      /** @deprecated use logOptions.verbose instead */
      verbose?: boolean;
      logOptions?: Partial<OverrideBuildOptions> & { verbose?: boolean };
    },
  ): (target: any) => void;
  function LoggedController(
    param?: any,
    _logOptions?: Partial<OverrideBuildOptions> & { verbose?: boolean },
  ): (target: any) => void {
    const logOptions = param?.logOptions ?? _logOptions ?? {};
    const verbose = param?.verbose ?? logOptions.verbose ?? false;

    return (target: any) => {
      const methods = Object.getOwnPropertyNames(target.prototype);

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
          LoggedRouteBuild(oB)(logOptions)(target.prototype, method, {
            value: target.prototype[method],
          });
        }
      });

      Controller(param)(target);
    };
  }

  return LoggedController;
}
