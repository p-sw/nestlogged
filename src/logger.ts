import { Logger } from "@nestjs/common";

type LogLevel = "debug" | "log" | "warn" | "verbose" | "error" | "fatal";

export class ScopedLogger extends Logger {
  scopeId?: string;

  constructor(
    private logger: Logger,
    private scope: string,
    private root: boolean = false
  ) {
    super();
  }

  public addScope(scopeId: string) {
    this.scopeId = scopeId;
  }

  private scopedLog(method: LogLevel) {
    return (message: string) => {
      this.logger[method](
        `${this.root ? "" : "-> "}${this.scope}${
          this.scopeId ? `(${this.scopeId})` : ""
        }: ${message}`
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
