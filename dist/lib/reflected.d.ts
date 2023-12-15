export type Path = string | string[];
export type Paths = Path[];
export interface IncludeExcludePath {
    includePath?: Paths;
    excludePath?: Paths;
}
export interface LoggedParamReflectData {
    name: string;
    index: number;
    include?: string[];
    exclude?: string[];
}
export interface ScopeKeyReflectData {
    name: string;
    index: number;
    path?: string[];
    priority?: number;
}
export interface ReturnsReflectData {
    name: string;
    path: string;
}
export declare const scopedLogger: unique symbol;
export declare const loggedParam: unique symbol;
export declare const scopeKey: unique symbol;
export declare const forceScopeKey: unique symbol;
export declare const returns: unique symbol;
export declare function InjectLogger(target: any, propertyKey: string | symbol, parameterIndex: number): void;
export declare function LoggedParam(name: string, options?: IncludeExcludePath): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function ScopeKey(name: string, options?: {
    path?: Path;
    priority?: number;
}): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function Returns<F extends Array<any>, R>(namePaths?: {
    [name: string]: string;
}): (_target: any, _key: string | symbol, descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>) => void;
export declare function ShouldScoped(_target: any, _key: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>): void;
