import { Logger } from "@nestjs/common";

type LogLevel = "debug" | "log" | "warn" | "verbose" | "error" | "fatal";

export class ScopedLogger extends Logger {
  constructor(
    private logger: Logger,
    private scope: string,
    private scopeId?: string
  ) {
    super();
  }

  private scopedLog(method: LogLevel) {
    return (message: string) => {
      this.logger[method](
        `-> ${this.scope}${this.scopeId ? `(${this.scopeId})` : ""}: ${message}`
      );
    };
  }

  debug = this.scopedLog("debug");
  log = this.scopedLog("log");
  warn = this.scopedLog("warn");
  verbose = this.scopedLog("verbose");
  error = this.scopedLog("error");
  fatal = this.scopedLog("fatal");
}
