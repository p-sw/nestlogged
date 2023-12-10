import { Logger } from "@nestjs/common";
export declare class ScopedLogger extends Logger {
    private logger;
    private scope;
    private scopeId?;
    constructor(logger: Logger, scope: string, scopeId?: string);
    addScope(scopeId: string): void;
    private scopedLog;
    debug: (message: string) => void;
    log: (message: string) => void;
    warn: (message: string) => void;
    verbose: (message: string) => void;
    error: (message: string) => void;
    fatal: (message: string) => void;
}
