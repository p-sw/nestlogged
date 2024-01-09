import { Logger } from "@nestjs/common";
import * as hyperid from 'hyperid';

const createId = hyperid({ fixedLength: true })

type LogLevel = "debug" | "log" | "warn" | "verbose" | "error" | "fatal";

export class ScopedLogger extends Logger {
  private readonly scopeId?: string;

  constructor(
    private logger: Logger,
    private scope: string,
    private root: boolean = false,
    private createScopeId: boolean = false,
  ) {
    super();
    if (this.createScopeId) this.scopeId = createId();
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
