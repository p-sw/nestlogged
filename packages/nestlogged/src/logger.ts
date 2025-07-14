import {
  Logger,
  LogLevel,
  Injectable,
  Optional,
  ConsoleLoggerOptions,
  ConsoleLogger as NestConsoleLogger,
  LoggerService,
} from '@nestjs/common';
import { inspect, InspectOptions } from 'util';
import {
  isString,
  isPlainObject,
  isFunction,
  isUndefined,
  clc,
  yellow,
  isScope,
  LogScopeInformation,
  NestloggedScopeId,
  NestloggedScope,
  formatScope,
} from './utils';
import * as hyperid from 'hyperid';

const createId = hyperid({ fixedLength: true });

export class ScopedLogger extends Logger {
  constructor(
    private logger: Logger,
    private scope: (string | string[])[],
    private scopeId: string = createId(),
  ) {
    super();
  }

  isLevelEnabled(level: LogLevel) {
    const localInstance = this.logger.localInstance;
    if (!localInstance) return false;
    if (!('isLevelEnabled' in localInstance)) {
      console.warn(
        'isLevelEnabled is not available on the logger, will return false',
      );
      return false;
    }
    return (
      localInstance as { isLevelEnabled: (level: LogLevel) => boolean }
    ).isLevelEnabled(level);
  }

  private scopedLog(method: LogLevel) {
    return (message: any) => {
      this.logger[method](
        {
          [NestloggedScopeId]: this.scopeId,
          [NestloggedScope]: this.scope,
        },
        message,
      );
    };
  }

  getScopeId() {
    return this.scopeId;
  }

  getCurrentScope() {
    return this.scope;
  }

  debug = this.scopedLog('debug');
  log = this.scopedLog('log');
  warn = this.scopedLog('warn');
  verbose = this.scopedLog('verbose');
  error = this.scopedLog('error');
  fatal = this.scopedLog('fatal');

  static fromSuper(
    baseLogger: Logger,
    logger: ScopedLogger,
    scope: string | string[],
  ): ScopedLogger {
    return new ScopedLogger(
      baseLogger,
      [...logger.scope, scope],
      logger.scopeId,
    );
  }
  static fromRoot(
    logger: Logger,
    scope: string | string[],
    scopeId?: string,
  ): ScopedLogger {
    return new ScopedLogger(logger, [scope], scopeId);
  }
  static createScopeId(): string {
    return createId();
  }
}

const DEFAULT_DEPTH = 5;

@Injectable()
export class ConsoleLogger extends NestConsoleLogger {
  constructor();
  constructor(context: string);
  constructor(options: ConsoleLoggerOptions);
  constructor(context: string, options: ConsoleLoggerOptions);
  constructor(
    @Optional()
    contextOrOptions?: string | ConsoleLoggerOptions,
    @Optional()
    options?: ConsoleLoggerOptions,
  ) {
    super(contextOrOptions as string /* fuck */, options);
  }

  /**
   * Write a 'log' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('log')) {
      return;
    }
    const { messages, context, scopeInfo } =
      this.getContextAndMessagesAndScopeToPrint([message, ...optionalParams]);
    this.printMessages(
      messages,
      context,
      'log',
      undefined,
      undefined,
      scopeInfo,
    );
  }

  /**
   * Write an 'error' level log, if the configured level allows for it.
   * Prints to `stderr` with newline.
   */
  error(message: any, stackOrContext?: string): void;
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('error')) {
      return;
    }
    const { messages, context, stack, scopeInfo } =
      this.getContextAndStackAndMessagesAndScopeToPrint([
        message,
        ...optionalParams,
      ]);

    this.printMessages(messages, context, 'error', 'stderr', stack, scopeInfo);
    this.printStackTrace(stack!);
  }

  /**
   * Write a 'warn' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('warn')) {
      return;
    }
    const { messages, context, scopeInfo } =
      this.getContextAndMessagesAndScopeToPrint([message, ...optionalParams]);
    this.printMessages(
      messages,
      context,
      'warn',
      undefined,
      undefined,
      scopeInfo,
    );
  }

  /**
   * Write a 'debug' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('debug')) {
      return;
    }
    const { messages, context, scopeInfo } =
      this.getContextAndMessagesAndScopeToPrint([message, ...optionalParams]);
    this.printMessages(
      messages,
      context,
      'debug',
      undefined,
      undefined,
      scopeInfo,
    );
  }

  /**
   * Write a 'verbose' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('verbose')) {
      return;
    }
    const { messages, context, scopeInfo } =
      this.getContextAndMessagesAndScopeToPrint([message, ...optionalParams]);
    this.printMessages(
      messages,
      context,
      'verbose',
      undefined,
      undefined,
      scopeInfo,
    );
  }

  /**
   * Write a 'fatal' level log, if the configured level allows for it.
   * Prints to `stdout` with newline.
   */
  fatal(message: any, context?: string): void;
  fatal(message: any, ...optionalParams: [...any, string?]): void;
  fatal(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('fatal')) {
      return;
    }
    const { messages, context, scopeInfo } =
      this.getContextAndMessagesAndScopeToPrint([message, ...optionalParams]);
    this.printMessages(
      messages,
      context,
      'fatal',
      undefined,
      undefined,
      scopeInfo,
    );
  }

  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
    scopeInfo?: LogScopeInformation,
  ) {
    messages.forEach((message) => {
      if (this.options.json) {
        this.printAsJson(message, {
          context,
          logLevel,
          writeStreamType,
          errorStack,
          scopeInfo,
        });
        return;
      }
      const pidMessage = this.formatPid(process.pid);
      const contextMessage = this.formatContext(context);
      const timestampDiff = this.updateAndGetTimestampDiff();
      const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');
      const formattedScopeInfo = this.formatScopeInfo(scopeInfo);
      const formattedMessage = this.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestampDiff,
        formattedScopeInfo,
      );

      process[writeStreamType ?? 'stdout'].write(formattedMessage);
    });
  }

  protected formatScopeInfo(
    scopeInfo?: LogScopeInformation,
  ): [string, string] | undefined {
    if (!scopeInfo) return undefined;
    const scopeId = scopeInfo[NestloggedScopeId];
    const formattedScope = formatScope(scopeInfo[NestloggedScope]);
    return this.options.colors
      ? [`ID=[${clc.cyanBright(scopeId)}] | `, clc.cyanBright(formattedScope)]
      : [`ID=[${scopeId}] | `, formattedScope];
  }

  protected printAsJson(
    message: unknown,
    options: {
      context: string;
      logLevel: LogLevel;
      writeStreamType?: 'stdout' | 'stderr';
      errorStack?: unknown;
      scopeInfo?: LogScopeInformation;
    },
  ) {
    type JsonLogObject = {
      level: LogLevel;
      pid: number;
      timestamp: number;
      message: unknown;
      context?: string;
      stack?: unknown;
      scopeId?: string;
      scope?: (string | string[])[];
    };

    const logObject: JsonLogObject = {
      level: options.logLevel,
      pid: process.pid,
      timestamp: Date.now(),
      message,
    };

    if (options.scopeInfo) {
      logObject.scopeId = options.scopeInfo[NestloggedScopeId];
      logObject.scope = options.scopeInfo[NestloggedScope];
    }

    if (options.context) {
      logObject.context = options.context;
    }

    if (options.errorStack) {
      logObject.stack = options.errorStack;
    }

    const formattedMessage =
      !this.options.colors && this.inspectOptions.compact === true
        ? JSON.stringify(logObject, this.stringifyReplacer)
        : inspect(logObject, this.inspectOptions);
    process[options.writeStreamType ?? 'stdout'].write(`${formattedMessage}\n`);
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
    formattedScopeInfo?: [string, string],
  ) {
    if (!formattedScopeInfo) formattedScopeInfo = ['', ''];
    const output = this.stringifyMessage(message, logLevel);
    pidMessage = this.colorize(pidMessage, logLevel);
    formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
    return `${pidMessage}${this.getTimestamp()} ${formattedLogLevel} ${contextMessage}${formattedScopeInfo[0]}${formattedScopeInfo[1]}${output}${timestampDiff}\n`;
  }

  protected stringifyMessage(message: unknown, logLevel: LogLevel) {
    if (isFunction(message)) {
      const messageAsStr = Function.prototype.toString.call(message);
      const isClass = messageAsStr.startsWith('class ');
      if (isClass) {
        // If the message is a class, we will display the class name.
        return this.stringifyMessage(message.name, logLevel);
      }
      // If the message is a non-class function, call it and re-resolve its value.
      return this.stringifyMessage(message(), logLevel);
    }

    if (typeof message === 'string') {
      return this.colorize(message, logLevel);
    }

    const outputText = inspect(message, this.inspectOptions);
    if (isPlainObject(message)) {
      return `Object(${Object.keys(message).length}) ${outputText}`;
    }
    if (Array.isArray(message)) {
      return `Array(${message.length}) ${outputText}`;
    }
    return outputText;
  }

  protected colorize(message: string, logLevel: LogLevel) {
    if (!this.options.colors || this.options.json) {
      return message;
    }
    const color = this._getColorByLogLevel(logLevel);
    return color(message);
  }

  protected printStackTrace(stack: string) {
    if (!stack || this.options.json) {
      return;
    }
    process.stderr.write(`${stack}\n`);
  }

  protected updateAndGetTimestampDiff(): string {
    const includeTimestamp =
      ConsoleLogger.lastTimestampAt && this.options?.timestamp;
    const result = includeTimestamp
      ? this.formatTimestampDiff(Date.now() - ConsoleLogger.lastTimestampAt!)
      : '';
    ConsoleLogger.lastTimestampAt = Date.now();
    return result;
  }

  protected formatTimestampDiff(timestampDiff: number) {
    const formattedDiff = ` +${timestampDiff}ms`;
    return this.options.colors ? yellow(formattedDiff) : formattedDiff;
  }

  protected getInspectOptions() {
    let breakLength = this.options.breakLength;
    if (typeof breakLength === 'undefined') {
      breakLength = this.options.colors
        ? this.options.compact
          ? Infinity
          : undefined
        : this.options.compact === false
          ? undefined
          : Infinity; // default breakLength to Infinity if inline is not set and colors is false
    }

    const inspectOptions: InspectOptions = {
      depth: this.options.depth ?? DEFAULT_DEPTH,
      sorted: this.options.sorted,
      showHidden: this.options.showHidden,
      compact: this.options.compact ?? (this.options.json ? true : false),
      colors: this.options.colors,
      breakLength,
    };

    if (this.options.maxArrayLength) {
      inspectOptions.maxArrayLength = this.options.maxArrayLength;
    }
    if (this.options.maxStringLength) {
      inspectOptions.maxStringLength = this.options.maxStringLength;
    }

    return inspectOptions;
  }

  protected stringifyReplacer(key: string, value: unknown) {
    // Mimic util.inspect behavior for JSON logger with compact on and colors off
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (
      value instanceof Map ||
      value instanceof Set ||
      value instanceof Error
    ) {
      return `${inspect(value, this.inspectOptions)}`;
    }
    return value;
  }

  private getContextAndMessagesAndScopeToPrint(args: unknown[]): {
    scopeInfo?: LogScopeInformation;
    messages: any;
    context?: string;
  } {
    if (isScope(args[0])) {
      return {
        scopeInfo: args[0],
        ...this.getContextAndMessagesAndScopeToPrint(args.slice(1)),
      };
    }
    if (args?.length <= 1) {
      return { messages: args, context: this.context };
    }
    const lastElement = args[args.length - 1];
    const isContext = isString(lastElement);
    if (!isContext) {
      return { messages: args, context: this.context };
    }
    return {
      context: lastElement,
      messages: args.slice(0, args.length - 1),
    };
  }

  private getContextAndStackAndMessagesAndScopeToPrint(args: unknown[]): {
    messages: any;
    context: string;
    stack?: string;
    scopeInfo?: LogScopeInformation;
  } {
    if (isScope(args[0])) {
      return {
        scopeInfo: args[0],
        ...this.getContextAndStackAndMessagesAndScopeToPrint(args.slice(1)),
      };
    }
    if (args.length === 2) {
      return this._isStackFormat(args[1])
        ? {
            messages: [args[0]],
            stack: args[1] as string,
            context: this.context,
          }
        : {
            messages: [args[0]],
            context: args[1] as string,
          };
    }

    const { messages, context } =
      this.getContextAndMessagesAndScopeToPrint(args);
    if (messages?.length <= 1) {
      return { messages, context };
    }
    const lastElement = messages[messages.length - 1];
    const isStack = isString(lastElement);
    // https://github.com/nestjs/nest/issues/11074#issuecomment-1421680060
    if (!isStack && !isUndefined(lastElement)) {
      return { messages, context };
    }
    return {
      stack: lastElement,
      messages: messages.slice(0, messages.length - 1),
      context,
    };
  }

  private _isStackFormat(stack: unknown) {
    if (!isString(stack) && !isUndefined(stack)) {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+/.test(stack!);
  }

  private _getColorByLogLevel(level: LogLevel) {
    switch (level) {
      case 'debug':
        return clc.magentaBright;
      case 'warn':
        return clc.yellow;
      case 'error':
        return clc.red;
      case 'verbose':
        return clc.cyanBright;
      case 'fatal':
        return clc.bold;
      default:
        return clc.green;
    }
  }
}
