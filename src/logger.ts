import { Logger, LogLevel } from "@nestjs/common";
import * as hyperid from 'hyperid';

const createId = hyperid({ fixedLength: true })

export class ScopedLogger extends Logger {
  constructor(
    private logger: Logger,
    private scope: string[],
    private scopeId: string = createId(),
  ) {
    super();
  }

  private scopedLog(method: LogLevel) {
    return (message: string) => {
      this.logger[method](
        `${this.scopeId ? `(ID ${this.scopeId}) | ` : ""
        }${this.scope.join(" -> ")}: ${message}`
      );
    };
  }

  debug = this.scopedLog("debug");
  log = this.scopedLog("log");
  warn = this.scopedLog("warn");
  verbose = this.scopedLog("verbose");
  error = this.scopedLog("error");
  fatal = this.scopedLog("fatal");

  static fromSuper(baseLogger: Logger, logger: ScopedLogger, scope: string): ScopedLogger {
    return new ScopedLogger(
      baseLogger, [...logger.scope, scope], logger.scopeId
    )
  };
  static fromRoot(logger: Logger, scope: string, scopeId?: string): ScopedLogger {
    return new ScopedLogger(
      logger, [scope], scopeId
    )
  };
  static createScopeId(): string {
    return createId();
  }
}