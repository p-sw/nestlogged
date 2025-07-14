import { Logger, ExecutionContext } from '@nestjs/common';
import {
  LoggedParamReflectData,
  IfReturnsReflectData,
  IfThrowsReflectData,
} from '../reflected';
import { LoggedMetadata } from './metadata';
import {
  BuildType,
  REQUEST_LOG_ID,
  copy,
  createCallLogIdentifyMessage,
  injectLogger,
  loggerInit,
} from './utils';
import { isEach } from '../utils';
import {
  objectContainedLogSync,
  getItemByPathSync,
} from '../internals/object-util';
import { isLevelEnabled, ScopedLogger } from '../logger';

export interface FunctionMetadata {
  scopedLoggerInjectableParam?: number;
  loggedParams?: LoggedParamReflectData[];
}

export function formatLoggedParam(args: any[], data: LoggedParamReflectData) {
  if (isEach(data.name)) {
    return Object.entries(data.name)
      .map(([name, path]) => [name, getItemByPathSync(args[data.index], path)])
      .filter((item) => item !== undefined)
      .map(([name, value]) => `${name}=${value}`)
      .join(', ');
  }
  if ('includePathTree' in data || 'excludePathTree' in data) {
    return `${data.name}=${objectContainedLogSync(args[data.index], { includePathTree: data.includePathTree, excludePathTree: data.excludePathTree })}`;
  }
  return `${data.name}=${objectContainedLogSync(args[data.index])}`;
}

export function formatReturnsData(
  returned: unknown,
  data: IfReturnsReflectData[],
  fallback: boolean,
) {
  if (data.length === 0) return '';
  for (const item of data) {
    if (item.ifReturns(returned)) {
      const result = item.transformer(copy(returned)); // each
      return (
        'WITH ' +
        Object.entries(result)
          .filter(([_, value]) => value !== undefined)
          .map(([name, value]) => `${name}=${value}`)
          .join(', ')
      );
    }
  }
  if (fallback) {
    return 'WITH ' + objectContainedLogSync(returned);
  }
  return '';
}

export function formatThrowsData(e: unknown, data: IfThrowsReflectData[]) {
  for (const item of data) {
    if (typeof item.error === 'function' && e instanceof item.error) {
      const result = item.transformer(e); // string | each
      return 'WITH ' + typeof result === 'string'
        ? result
        : Object.entries(result)
            .filter(([_, value]) => value !== undefined)
            .map(([name, value]) => `${name}=${value}`)
            .join(', ');
    }
  }
  // if doesn't match, try with default Error message
  if (e instanceof Error) {
    return 'WITH ' + e.message;
  }
  return '';
}

export function overrideBuild<F extends Array<any>, R>(
  type: 'route',
  originalFunction: (...args: F) => R,
  _target: any,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: IfReturnsReflectData[],
  returnsFallback: boolean,
  throwsData: IfThrowsReflectData[],
  logged: LoggedMetadata,
  route: string,
): (...args: F) => R;
export function overrideBuild<F extends Array<any>, R>(
  type: 'function' | 'guard' | 'interceptor' | 'middleware' | 'exception',
  originalFunction: (...args: F) => R,
  _target: any,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: IfReturnsReflectData[],
  returnsFallback: boolean,
  throwsData: IfThrowsReflectData[],
  logged: LoggedMetadata,
): (...args: F) => R;
export function overrideBuild<F extends Array<any>, R>(
  type: BuildType,
  originalFunction: (...args: F) => R,
  _target: any,
  metadatas: FunctionMetadata,
  key: string,
  returnsData: IfReturnsReflectData[],
  returnsFallback: boolean,
  throwsData: IfThrowsReflectData[],
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
        injectLogger({
          args,
          baseLogger,
          paramIndex: metadatas.scopedLoggerInjectableParam,
          scope: [name, key],
        });
      } else {
        // special, can access to request object
        if (
          type === 'guard' ||
          type === 'interceptor' ||
          type === 'exception'
        ) {
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
            injectLogger({
              args,
              baseLogger,
              paramIndex: metadatas.scopedLoggerInjectableParam,
              scope: [name, key],
              scopeId: req[REQUEST_LOG_ID],
            });
          }
        } else if (type === 'middleware') {
          let req = args[0];
          if (req[REQUEST_LOG_ID] === undefined) {
            req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
          }
          injectLogger({
            args,
            baseLogger,
            paramIndex: metadatas.scopedLoggerInjectableParam,
            scope: [name, key],
            scopeId: req[REQUEST_LOG_ID],
          });
        } else if (type === 'route') {
          // args[metadatas.scopedLoggerInjectableParam] is now Request object, thanks to code in @LoggedRoute!!!!
          let req = args[metadatas.scopedLoggerInjectableParam];
          if (req[REQUEST_LOG_ID] === undefined) {
            req[REQUEST_LOG_ID] = ScopedLogger.createScopeId();
          }
          injectLogger({
            args,
            baseLogger,
            paramIndex: metadatas.scopedLoggerInjectableParam,
            scope: [name, key],
            scopeId: req[REQUEST_LOG_ID],
            replace: true,
          });
        }
      }

      injectedLogger = args[metadatas.scopedLoggerInjectableParam];
    }

    const isCallLogEnabled =
      logged.options.callLogLevel !== 'skip' &&
      isLevelEnabled(injectedLogger, logged.options.callLogLevel);
    const isReturnLogEnabled =
      logged.options.returnLogLevel !== 'skip' &&
      isLevelEnabled(injectedLogger, logged.options.returnLogLevel);
    const isErrorLogEnabled =
      logged.options.errorLogLevel !== 'skip' &&
      isLevelEnabled(injectedLogger, logged.options.errorLogLevel);

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
    if (isCallLogEnabled) {
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
                .map((data) => formatLoggedParam(args, data))
                .join(', ')
            : ''
        }`,
      );
    }

    try {
      const r: R = originalFunction.call(this, ...args); // Try to call original function
      if (
        originalFunction.constructor.name === 'AsyncFunction' ||
        (r && typeof r === 'object' && typeof r['then'] === 'function')
      ) {
        return r['then']((r: any) => {
          // async return logging
          const resultLogged = formatReturnsData(
            r,
            returnsData,
            returnsFallback,
          );
          injectedLogger[logged.options.returnLogLevel](
            `${createCallLogIdentifyMessage('RETURNED', type, `${name}.${key}`, route)} ${resultLogged}`,
          );
          return r;
        })['catch']((e: any) => {
          // async error logging
          if (isErrorLogEnabled) {
            const throwsLogged = formatThrowsData(e, throwsData);
            injectedLogger[logged.options.errorLogLevel](
              `${createCallLogIdentifyMessage('ERROR', type, `${name}.${key}`, route)} ${throwsLogged}`,
            );
          }
          throw e;
        });
      } else {
        // return logging
        if (isReturnLogEnabled) {
          const resultLogged = formatReturnsData(
            r,
            returnsData,
            returnsFallback,
          );
          injectedLogger[logged.options.returnLogLevel](
            `${createCallLogIdentifyMessage('RETURNED', type, `${name}.${key}`, route)} ${resultLogged}`,
          );
          return r;
        }
      }
    } catch (e) {
      // error logging
      if (isErrorLogEnabled) {
        const throwsLogged = formatThrowsData(e, throwsData);
        injectedLogger[logged.options.errorLogLevel](
          `${createCallLogIdentifyMessage('ERROR', type, `${name}.${key}`, route)} ${throwsLogged}`,
        );
      }
      throw e;
    }
  };
}
