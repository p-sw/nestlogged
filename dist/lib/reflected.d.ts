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
export declare const scopedLogger: unique symbol;
export declare const loggedParam: unique symbol;
export declare const scopeKey: unique symbol;
export declare const forceScopeKey: unique symbol;
export declare function InjectLogger(target: any, propertyKey: string | symbol, parameterIndex: number): void;
export declare function LoggedParam(name: string, options?: {
    includePath?: (string | string[])[];
    excludePath?: (string | string[])[];
}): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function ScopeKey(name: string, options?: {
    path?: string | string[];
    priority?: number;
}): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function ShouldScoped(_target: any, _key: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>): void;
