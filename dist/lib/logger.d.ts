import { Logger } from "@nestjs/common";
export declare class ScopedLogger extends Logger {
    private logger;
    private scope;
    private root;
    private createScopeId;
    private readonly scopeId?;
    constructor(logger: Logger, scope: string, root?: boolean, createScopeId?: boolean);
    private scopedLog;
    debug: (message: string) => void;
    log: (message: string) => void;
    warn: (message: string) => void;
    verbose: (message: string) => void;
    error: (message: string) => void;
    fatal: (message: string) => void;
}
