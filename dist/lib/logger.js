"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopedLogger = void 0;
const common_1 = require("@nestjs/common");
class ScopedLogger extends common_1.Logger {
    constructor(logger, scope, root = false) {
        super();
        this.logger = logger;
        this.scope = scope;
        this.root = root;
        this.debug = this.scopedLog("debug");
        this.log = this.scopedLog("log");
        this.warn = this.scopedLog("warn");
        this.verbose = this.scopedLog("verbose");
        this.error = this.scopedLog("error");
        this.fatal = this.scopedLog("fatal");
    }
    addScope(scopeId) {
        this.scopeId = scopeId;
    }
    scopedLog(method) {
        return (message) => {
            this.logger[method](`${this.root ? "" : "-> "}${this.scope}${this.scopeId ? `(${this.scopeId})` : ""}: ${message}`);
        };
    }
}
exports.ScopedLogger = ScopedLogger;
