import { LogLevel, ControllerOptions, ScopeOptions, ExecutionContext } from "@nestjs/common";
export declare function LoggedInjectable(options?: ScopeOptions & {
    verbose?: boolean;
}): (target: any) => void;
export declare function LoggedController(): (target: any) => void;
export declare function LoggedController(prefix: string | string[]): (target: any) => void;
export declare function LoggedController(options: ControllerOptions & {
    verbose?: boolean;
}): (target: any) => void;
interface OverrideBuildOptions {
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
export declare function LoggedFunction<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => R | Promise<R>>) => void;
export declare function LoggedRoute<F extends Array<any>, R>(route?: string, options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => R>) => void;
export declare function LoggedGuard<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>) => void;
export declare function LoggedInterceptor<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(context: ExecutionContext, ...args: F) => R>) => void;
export {};
