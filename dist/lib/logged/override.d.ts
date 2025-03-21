import { Logger } from '@nestjs/common';
import { LoggedParamReflectData, ReturnsReflectData } from '../reflected';
import { LoggedMetadata } from './metadata';
interface FunctionMetadata {
    scopedLoggerInjectableParam?: number;
    loggedParams?: LoggedParamReflectData[];
}
export declare function overrideBuild<F extends Array<any>, R>(type: 'route', originalFunction: (...args: F) => R, baseLogger: Logger, metadatas: FunctionMetadata, key: string, returnsData: ReturnsReflectData[] | string | true, logged: LoggedMetadata, route: string): (...args: F) => R;
export declare function overrideBuild<F extends Array<any>, R>(type: 'function' | 'guard' | 'interceptor' | 'middleware', originalFunction: (...args: F) => R, baseLogger: Logger, metadatas: FunctionMetadata, key: string, returnsData: ReturnsReflectData[] | string | true, logged: LoggedMetadata): (...args: F) => R;
export {};
