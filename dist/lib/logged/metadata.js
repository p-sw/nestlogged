"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedMetadata = exports.nestLoggedMetadata = void 0;
const utils_1 = require("./utils");
exports.nestLoggedMetadata = Symbol('nlogdec-metadata');
class LoggedMetadata {
    constructor(options) {
        this.options = {
            ...utils_1.defaultOverrideBuildOptions,
            ...(options ?? {}),
        };
    }
    updateOption(options) {
        this.options = {
            ...this.options,
            ...options,
        };
    }
}
exports.LoggedMetadata = LoggedMetadata;
