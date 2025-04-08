import { Logger, ExecutionContext, ArgumentsHost } from '@nestjs/common';
import { LoggedParamReflectData, ReturnsReflectData } from '../reflected';
import { LoggedMetadata } from './metadata';
import {
  BuildType,
  REQUEST_LOG_ID,
  createCallLogIdentifyMessage,
  injectLogger,
  loggerInit,
} from './utils';
import { objectContainedLogSync, getItemByPathSync } from '../internals/utils';
import { ScopedLogger } from '../logger';

interface FunctionMetadata {
  scopedLoggerInjectableParam?: number;
  loggedParams?: LoggedParamReflectData[];
}

export function overrideBuild<F extends Array<any>, R>(
  type: 'route',
  originalFunction: (...args: F) => R,
  _target: any,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  logged: LoggedMetadata,
  route: string,
): (...args: F) => R;
export function overrideBuild<F extends Array<any>, R>(
  type: 'function' | 'guard' | 'interceptor' | 'middleware' | 'exception',
  originalFunction: (...args: F) => R,
  _target: any,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  logged: LoggedMetadata,
): (...args: F) => R;
export function overrideBuild<F extends Array<any>, R>(
  type: BuildType,
  originalFunction: (...args: F) => R,
  _target: any,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: ReturnsReflectData[] | string | true,
  logged: LoggedMetadata,
  route?: string,
): (...args: F) => R {
  const name = _target.name ?? _target.constructor.name;

  return function (...args: F): R {
    const baseLogger: Logger = loggerInit(_target);

    // Creating ScopedLogger
    let injectedLogger: Logger = baseLogger;
    if (typeof metadatas.scopedLoggerInjectableParam !== 'undefined') {
      if (type === 'function') {
        injectLogger(args, baseLogger, metadatas.scopedLoggerInjectableParam, [name, key]);
      } else {
        // special, can access to request object
        if (type === 'guard' || type === 'interceptor' || type === 'exception') {
          // args[0] == ExecutionContext
          const ctx = args[type === 'exception' ? 1 : 0] as ExecutionContext;
          if (ctx.getType() !== 'http') {
            injectedLogger.error(
              'Cannot inject logger: Request type is not http',
            );
          } else {
            let req = ctx.switchToHttp().getRequest();
            if (req[REQUEST_LOG_ID] === undefined) {
              req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
            }
            injectLogger(args, baseLogger, metadatas.scopedLoggerInjectableParam, [name, key], req[REQUEST_LOG_ID]);
          }
        } else if (type === 'middleware') {
          let req = args[0];
          if (req[REQUEST_LOG_ID] === undefined) {
            req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
          }
          injectLogger(args, baseLogger, metadatas.scopedLoggerInjectableParam, [name, key], req[REQUEST_LOG_ID]);
        } else if (type === 'route') {
          // args[metadatas.scopedLoggerInjectableParam] is now Request object, thanks to code in @LoggedRoute!!!!
          let req = args[metadatas.scopedLoggerInjectableParam];
          if (req[REQUEST_LOG_ID] === undefined) {
            req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
          }
          injectLogger(args, baseLogger, metadatas.scopedLoggerInjectableParam, [name, key], req[REQUEST_LOG_ID]);
        }
      }

      injectedLogger = args[metadatas.scopedLoggerInjectableParam];
    }

    // If this is ExecutionContext based function (e.g. Guard, Interceptor) get Request from Context
    if (type === 'guard' || type === 'interceptor') {
      const context = args[0] as ExecutionContext;
      if (context.getType() === 'http') {
        const req = context.switchToHttp().getRequest();
        route = req.url;
      }
    } else if (type === 'middleware') {
      const req = args[0];
      route = req.url;
    }

    // Start Log
    if (logged.options.callLogLevel !== 'skip') {
      const callLogIdentifyMessage =
        type === 'middleware' ||
        type === 'guard' ||
        type === 'interceptor' ||
        type === 'route'
          ? createCallLogIdentifyMessage('HIT', type, `${name}.${key}`, route)
          : createCallLogIdentifyMessage('HIT', type, `${name}.${key}`);
      injectedLogger[logged.options.callLogLevel](
        `${callLogIdentifyMessage} ${
          metadatas.loggedParams && metadatas.loggedParams.length > 0
            ? 'WITH ' +
              metadatas.loggedParams
                .map(
                  ({ name, index, include, exclude }) =>
                    name +
                    '=' +
                    objectContainedLogSync(args[index], {
                      include,
                      exclude,
                    }),
                )
                .join(', ')
            : ''
        }`,
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
              ? typeof r === 'object' && r !== null
                ? 'WITH ' +
                  returnsData
                    .map(({ name, path }) => {
                      const value = getItemByPathSync(r, path);

                      return value !== undefined ? `${name}=${value}` : '';
                    })
                    .filter((v) => v.length > 0)
                    .join(', ')
                : ''
              : typeof returnsData === 'string'
                ? 'WITH ' + returnsData + '=' + typeof r === 'object'
                  ? JSON.stringify(r)
                  : r
                : returnsData
                  ? typeof r === 'object'
                    ? 'WITH ' + JSON.stringify(r)
                    : 'WITH ' + r
                  : '';

            injectedLogger[logged.options.returnLogLevel](
              `${createCallLogIdentifyMessage('RETURNED', type, `${name}.${key}`, route)} ${resultLogged}`,
            );
            return r;
          });
        } else {
          const resultLogged = Array.isArray(returnsData)
            ? typeof r === 'object' && r !== null
              ? 'WITH ' +
                returnsData
                  .map(({ name, path }) => {
                    const value = getItemByPathSync(r, path);

                    return value !== undefined ? `${name}=${value}` : '';
                  })
                  .filter((v) => v.length > 0)
                  .join(', ')
              : ''
            : typeof returnsData === 'string'
              ? 'WITH ' + returnsData + '=' + typeof r === 'object'
                ? JSON.stringify(r)
                : r
              : returnsData
                ? typeof r === 'object'
                  ? 'WITH ' + JSON.stringify(r)
                  : 'WITH ' + r
                : '';

          injectedLogger[logged.options.returnLogLevel](
            `${createCallLogIdentifyMessage('RETURNED', type, `${name}.${key}`, route)} ${resultLogged}`,
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
          `${createCallLogIdentifyMessage('ERROR', type, `${name}.${key}`, route)} ${e}`,
        );
      }
      throw e;
    }
  };
}
