"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestLogger = void 0;
const common_1 = require("@nestjs/common");
const logger_1 = require("./logger");
const utils_1 = require("./logged/utils");
const logger = new common_1.Logger();
function getRequestLogger(functionName, req) {
    return new logger_1.ScopedLogger(logger, [functionName], req[utils_1.REQUEST_LOG_ID]);
}
exports.getRequestLogger = getRequestLogger;
