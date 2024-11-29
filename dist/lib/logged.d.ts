import { ControllerOptions, ScopeOptions } from "@nestjs/common";
export declare function LoggedInjectable(options?: ScopeOptions & {
    verbose?: boolean;
}): (target: any) => void;
export declare function LoggedController(): (target: any) => void;
export declare function LoggedController(prefix: string | string[]): (target: any) => void;
export declare function LoggedController(options: ControllerOptions & {
    verbose?: boolean;
}): (target: any) => void;
interface OverrideBuildOptions {
    skipCallLog: boolean;
    skipReturnLog: boolean;
    skipErrorLog: boolean;
}
export declare function LoggedFunction<F extends Array<any>, R>(options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => R | Promise<R>>) => void;
export declare function LoggedRoute<F extends Array<any>, R>(route?: string, options?: Partial<OverrideBuildOptions>): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => R>) => void;
export {};
