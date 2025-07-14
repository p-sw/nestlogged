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
  createCallLogIdentifyMessage,
  injectLogger,
  loggerInit,
} from './utils';
import { isLevelEnabled, ScopedLogger } from '../logger';
import {
  formatLoggedParam,
  formatReturnsData,
  formatThrowsData,
} from './formatter';

export interface FunctionMetadata {
  scopedLoggerInjectableParam?: number;
  loggedParams?: LoggedParamReflectData[];
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
      let req: any;
      switch (type) {
        case 'function':
          req = null;
          injectLogger({
            args,
            baseLogger,
            paramIndex: metadatas.scopedLoggerInjectableParam,
            scope: [name, key],
          });
          break;
        case 'guard':
        case 'interceptor':
        case 'exception':
          // args[0] == ExecutionContext
          const ctx = args[type === 'exception' ? 1 : 0] as ExecutionContext;
          if (ctx.getType() !== 'http') {
            injectedLogger.error(
              'Cannot inject logger: Request type is not http',
            );
            break;
          }
          req = ctx.switchToHttp().getRequest();
          break;
        case 'middleware':
          req = args[0];
          break;
        case 'route':
          req = args[metadatas.scopedLoggerInjectableParam];
          break;
      }

      if (req) {
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
