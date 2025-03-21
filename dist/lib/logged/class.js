"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedController = exports.LoggedInjectable = void 0;
const common_1 = require("@nestjs/common");
const utils_1 = require("./utils");
const methods_1 = require("./methods");
function LoggedInjectable(options) {
    return (target) => {
        (0, utils_1.loggerInit)(target.prototype);
        const logger = target.prototype.logger;
        const methods = Object.getOwnPropertyNames(target.prototype);
        methods.forEach((method) => {
            if (method !== 'constructor' &&
                typeof target.prototype[method] === 'function') {
                if (options && options.verbose)
                    logger.log(`LoggedFunction applied to ${method}`);
                (0, methods_1.LoggedFunction)()(target.prototype, method, {
                    value: target.prototype[method],
                });
            }
        });
        (0, common_1.Injectable)(options)(target);
    };
}
exports.LoggedInjectable = LoggedInjectable;
function LoggedController(param) {
    return (target) => {
        (0, utils_1.loggerInit)(target.prototype);
        const logger = target.prototype.logger;
        const methods = Object.getOwnPropertyNames(target.prototype);
        let verbose = typeof param === 'object' && Object.keys(param).includes('verbose')
            ? param.verbose
            : false;
        methods.forEach((method) => {
            if (method !== 'constructor' &&
                typeof target.prototype[method] === 'function') {
                if (verbose) {
                    const path = Reflect.getMetadata('path', target.prototype[method]);
                    const httpMethod = Reflect.getMetadata('method', target.prototype[method]);
                    logger.log(`LoggedRoute applied to ${method} (${utils_1.RevRequestMethod[httpMethod]} ${path})`);
                }
                (0, methods_1.LoggedRoute)()(target.prototype, method, {
                    value: target.prototype[method],
                });
            }
        });
        (0, common_1.Controller)(param)(target);
    };
}
exports.LoggedController = LoggedController;
