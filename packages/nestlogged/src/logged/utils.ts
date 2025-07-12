import { Logger, LogLevel } from '@nestjs/common';
import { ScopedLogger } from '../logger';

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

interface InjectLoggerOptions<T extends Array<any>> {
  args: T;
  baseLogger: Logger;
  paramIndex: number;
  scope: string | string[];
  scopeId?: string;
  replace?: boolean;
}

/**
 * @internal
 */
export function injectLogger<T extends Array<any>>({
  args,
  baseLogger,
  paramIndex,
  scope,
  scopeId,
  replace,
}: InjectLoggerOptions<T>) {
  if (args.length <= paramIndex) {
    if (args.length !== paramIndex)
      for (let i = args.length; i < paramIndex; i++) args.push(undefined);
    args.push(ScopedLogger.fromRoot(baseLogger, scope, scopeId));
  } else if (!(args[paramIndex] instanceof ScopedLogger)) {
    args.splice(
      paramIndex,
      !!replace ? 1 : 0,
      ScopedLogger.fromRoot(baseLogger, scope, scopeId),
    );
  } else {
    args[paramIndex] = ScopedLogger.fromSuper(
      baseLogger,
      args[paramIndex],
      scope,
    );
  }
}

export function copy<T>(data: T): T {
  if (data === undefined || data === null) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(copy) as T;
    }
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = copy(value);
    }
    return result as T;
  }
  return data;
}
