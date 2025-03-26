import { Logger, LogLevel } from '@nestjs/common';
import { ScopedLogger } from './logger';
import { REQUEST_LOG_ID } from './logged/utils';

const logger = new Logger();

export function getRequestLogger(functionName: string, req: any): ScopedLogger {
  return new ScopedLogger(logger, [functionName], req[REQUEST_LOG_ID]);
}

export const NestloggedScopeId = Symbol('nestlogged_scopeId');
export const NestloggedScope = Symbol('nestlogged_scope');
export interface LogScopeInformation {
  [NestloggedScopeId]: string;
  [NestloggedScope]: (string | string[])[];
}

export const isNil = (val: any): val is null | undefined =>
  isUndefined(val) || val === null;
export const isFunction = (val: any): val is Function =>
  typeof val === 'function';
export const isObject = (fn: any): fn is object =>
  !isNil(fn) && typeof fn === 'object';
export const isPlainObject = (fn: any): fn is object => {
  if (!isObject(fn)) {
    return false;
  }
  const proto = Object.getPrototypeOf(fn);
  if (proto === null) {
    return true;
  }
  const ctor =
    Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
    proto.constructor;
  return (
    typeof ctor === 'function' &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) ===
      Function.prototype.toString.call(Object)
  );
};
export const isString = (val: any): val is string => typeof val === 'string';
export const isUndefined = (obj: any): obj is undefined =>
  typeof obj === 'undefined';
export const isScope = (obj: any): obj is LogScopeInformation =>
  typeof obj === 'object' &&
  obj !== null &&
  NestloggedScopeId in obj &&
  NestloggedScope in obj;


const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  log: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

/**
 * Checks if target level is enabled.
 * @param targetLevel target level
 * @param logLevels array of enabled log levels
 */
export function isLogLevelEnabled(
  targetLevel: LogLevel,
  logLevels: LogLevel[] | undefined,
): boolean {
  if (!logLevels || (Array.isArray(logLevels) && logLevels?.length === 0)) {
    return false;
  }
  if (logLevels.includes(targetLevel)) {
    return true;
  }
  const highestLogLevelValue = logLevels
    .map(level => LOG_LEVEL_VALUES[level])
    .sort((a, b) => b - a)?.[0];

  const targetLevelValue = LOG_LEVEL_VALUES[targetLevel];
  return targetLevelValue >= highestLogLevelValue;
}

type ColorTextFn = (text: string) => string;

const isColorAllowed = () => !process.env.NO_COLOR;
const colorIfAllowed = (colorFn: ColorTextFn) => (text: string) =>
  isColorAllowed() ? colorFn(text) : text;

export const clc = {
  bold: colorIfAllowed((text: string) => `\x1B[1m${text}\x1B[0m`),
  green: colorIfAllowed((text: string) => `\x1B[32m${text}\x1B[39m`),
  yellow: colorIfAllowed((text: string) => `\x1B[33m${text}\x1B[39m`),
  red: colorIfAllowed((text: string) => `\x1B[31m${text}\x1B[39m`),
  magentaBright: colorIfAllowed((text: string) => `\x1B[95m${text}\x1B[39m`),
  cyanBright: colorIfAllowed((text: string) => `\x1B[96m${text}\x1B[39m`),
};
export const yellow = colorIfAllowed(
  (text: string) => `\x1B[38;5;3m${text}\x1B[39m`,
);

export function formatScope(scopes: (string | string[])[]): string {
  return scopes.map((v) => typeof v === 'string' ? v : v.join('.')).join(' -> ') + ' ';
}