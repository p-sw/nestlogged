"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopedLogger = void 0;
const common_1 = require("@nestjs/common");
const hyperid = require("hyperid");
const createId = hyperid({ fixedLength: true });
class ScopedLogger extends common_1.Logger {
    constructor(logger, scope, scopeId = createId()) {
        super();
        this.logger = logger;
        this.scope = scope;
        this.scopeId = scopeId;
        this.debug = this.scopedLog("debug");
        this.log = this.scopedLog("log");
        this.warn = this.scopedLog("warn");
        this.verbose = this.scopedLog("verbose");
        this.error = this.scopedLog("error");
        this.fatal = this.scopedLog("fatal");
    }
    scopedLog(method) {
        return (message) => {
            this.logger[method](`${this.scopeId ? `(ID ${this.scopeId}) | ` : ""}${this.scope.join(" -> ")}: ${message}`);
        };
    }
    static fromSuper(baseLogger, logger, scope) {
        return new ScopedLogger(baseLogger, [...logger.scope, scope], logger.scopeId);
    }
    ;
    static fromRoot(logger, scope) {
        return new ScopedLogger(logger, [scope]);
    }
    ;
}
exports.ScopedLogger = ScopedLogger;
