"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
class ScopedLogger extends common_1.Logger {
    constructor(logger, scope, scopeId) {
        super();
        this.logger = logger;
        this.scope = scope;
        this.scopeId = scopeId;
        this.debug = this.scopedLog('debug');
        this.log = this.scopedLog('log');
        this.warn = this.scopedLog('warn');
        this.verbose = this.scopedLog('verbose');
        this.error = this.scopedLog('error');
        this.fatal = this.scopedLog('fatal');
    }
    scopedLog(method) {
        return (message) => {
            this.logger[method](`-> ${this.scope}${this.scopeId ? `(${this.scopeId})` : ''}: ${message}`);
        };
    }
}
exports.default = ScopedLogger;
//# sourceMappingURL=logger.js.map