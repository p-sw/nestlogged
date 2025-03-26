import { LogLevel } from '@nestjs/common';
export declare const RevRequestMethod: string[];
export declare function loggerInit(_target: any): void;
export type BuildType = 'route' | 'function' | 'guard' | 'interceptor' | 'middleware';
export declare function createCallLogIdentifyMessage(message: 'HIT' | 'RETURNED' | 'ERROR', type: BuildType, key?: string, route?: string): string;
export declare const REQUEST_LOG_ID = "__nestlogged_request_log_id__";
export interface OverrideBuildOptions {
    callLogLevel: LogLevel | 'skip';
    returnLogLevel: LogLevel | 'skip';
    errorLogLevel: LogLevel | 'skip';
    /** @deprecated use `callLogLevel: 'skip'` instead */
    skipCallLog: boolean;
    /** @deprecated use `returnLogLevel: 'skip'` instead */
    skipReturnLog: boolean;
    /** @deprecated use `errorLogLevel: 'skip'` instead */
    skipErrorLog: boolean;
}
export declare const defaultOverrideBuildOptions: OverrideBuildOptions;
