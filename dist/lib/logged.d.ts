import { ControllerOptions, ScopeOptions } from "@nestjs/common";
export declare function LoggedInjectable(options?: ScopeOptions): (target: any) => void;
export declare function LoggedController(): (target: any) => void;
export declare function LoggedController(prefix: string | string[]): (target: any) => void;
export declare function LoggedController(options: ControllerOptions): (target: any) => void;
export declare function LoggedFunction<F extends Array<any>, R>(_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>): void;
export declare function LoggedRoute<F extends Array<any>, R>(route?: string): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>) => void;
