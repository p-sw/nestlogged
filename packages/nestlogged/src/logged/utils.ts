import { Logger, LogLevel } from '@nestjs/common';

export const RevRequestMethod = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'ALL',
  'OPTIONS',
  'HEAD',
  'SEARCH',
];

export function loggerInit(_target: any) {
  if (!Object.getOwnPropertyNames(_target).includes('logger')) {
    const newTargetLogger = new Logger(_target.constructor.name);
    newTargetLogger.log('Logger Initialized.');
    Object.defineProperty(_target, 'logger', {
      writable: false,
      enumerable: false,
      configurable: false,
      value: newTargetLogger,
    });
  }

  return _target.logger as Logger;
}

export type BuildType =
  | 'route'
  | 'function'
  | 'guard'
  | 'interceptor'
  | 'middleware'
  | 'exception';

const callLogIdentifyMessageDictionary: Record<BuildType, string> = {
  route: 'ENDPOINT',
  function: 'FUNCTION',
  guard: 'GUARD',
  interceptor: 'INTERCEPTOR',
  middleware: 'MIDDLEWARE',
  exception: 'EXCEPTION FILTER',
};

export function createCallLogIdentifyMessage(
  message: 'HIT' | 'RETURNED' | 'ERROR',
  type: BuildType,
  key?: string,
  route?: string,
) {
  if (message === 'ERROR')
    return `ERROR WHILE ${callLogIdentifyMessageDictionary[type]} ${key} (${route}): `;

  if (
    type === 'guard' ||
    type === 'interceptor' ||
    type === 'middleware' ||
    type === 'route'
  )
    return `${message} ${callLogIdentifyMessageDictionary[type]} ${key} (${route})`;
  if (type === 'function')
    return `${message} ${callLogIdentifyMessageDictionary[type]} ${key}`;

  return `${message} ${callLogIdentifyMessageDictionary[type]}`;
}

export const REQUEST_LOG_ID = '__nestlogged_request_log_id__';

export interface OverrideBuildOptions {
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

export const defaultOverrideBuildOptions: OverrideBuildOptions = {
  callLogLevel: 'log',
  returnLogLevel: 'log',
  errorLogLevel: 'error',
  skipCallLog: false,
  skipReturnLog: false,
  skipErrorLog: false,
};
