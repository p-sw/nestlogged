import { Logger } from "@nestjs/common";
export default class ScopedLogger extends Logger {
    private logger;
    private scope;
    private scopeId?;
    constructor(logger: Logger, scope: string, scopeId?: string);
    private scopedLog;
    debug: (message: string) => void;
    log: (message: string) => void;
    warn: (message: string) => void;
    verbose: (message: string) => void;
    error: (message: string) => void;
    fatal: (message: string) => void;
}
//# sourceMappingURL=logger.d.ts.map