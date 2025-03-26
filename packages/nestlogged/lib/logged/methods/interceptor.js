"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedInterceptor = void 0;
const utils_1 = require("../utils");
const metadata_1 = require("../metadata");
const reflected_1 = require("../../reflected");
const override_1 = require("../override");
function LoggedInterceptor(options) {
    return (_target, key, descriptor) => {
        (0, utils_1.loggerInit)(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== 'function') {
            logger.warn(`LoggedInterceptor decorator applied to non-function property: ${key}`);
            return;
        }
        const logMetadata = Reflect.getOwnMetadata(metadata_1.nestLoggedMetadata, _target, key);
        if (logMetadata) {
            // already applied, override instead
            logMetadata.updateOption(options);
            return;
        }
        const newMetadata = new metadata_1.LoggedMetadata(options);
        const all = Reflect.getMetadataKeys(fn).map((k) => [
            k,
            Reflect.getMetadata(k, fn),
        ]);
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = (0, override_1.overrideBuild)('interceptor', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams: [],
        }, _target.constructor.name, returnsData, newMetadata);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(metadata_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedInterceptor = LoggedInterceptor;
