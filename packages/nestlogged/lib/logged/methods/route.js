"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedRoute = void 0;
const utils_1 = require("../utils");
const metadata_1 = require("../metadata");
const reflected_1 = require("../../reflected");
const override_1 = require("../override");
const nest_1 = require("../../internals/nest");
function LoggedRoute(route, options) {
    return (_target, key, descriptor) => {
        (0, utils_1.loggerInit)(_target);
        const logger = _target.logger;
        const fn = descriptor.value;
        if (!fn || typeof fn !== 'function') {
            logger.warn(`LoggedRoute decorator applied to non-function property: ${key}`);
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
        const httpPath = Reflect.getMetadata('path', fn);
        const httpMethod = Reflect.getMetadata('method', fn);
        const fullRoute = `${_target.constructor.name}::${route ?? httpPath}[${utils_1.RevRequestMethod[httpMethod]}]`;
        const scopedLoggerInjectableParam = Reflect.getOwnMetadata(reflected_1.scopedLogger, _target, key);
        // if @InjectLogger exists, fake nestjs as it is @Req()
        if (scopedLoggerInjectableParam !== undefined) {
            (0, nest_1.createRouteParamDecorator)(0)()(_target, key, scopedLoggerInjectableParam);
        }
        const loggedParams = Reflect.getOwnMetadata(reflected_1.loggedParam, _target, key);
        const returnsData = Reflect.getOwnMetadata(reflected_1.returns, fn);
        const overrideFunction = (0, override_1.overrideBuild)('route', fn, logger, {
            scopedLoggerInjectableParam,
            loggedParams,
        }, key, returnsData, newMetadata, fullRoute);
        _target[key] = overrideFunction;
        descriptor.value = overrideFunction;
        Reflect.defineMetadata(metadata_1.nestLoggedMetadata, newMetadata, _target, key);
        all.forEach(([k, v]) => {
            Reflect.defineMetadata(k, v, _target[key]);
            Reflect.defineMetadata(k, v, descriptor.value);
        });
    };
}
exports.LoggedRoute = LoggedRoute;
