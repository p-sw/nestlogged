export interface LoggedParamReflectData {
    name: string;
    index: number;
    include?: string[];
    exclude?: string[];
}
export declare const scopedLogger: unique symbol;
export declare const loggedParam: unique symbol;
export declare function InjectLogger(target: any, propertyKey: string | symbol, parameterIndex: number): void;
export declare function LoggedParam(name: string, options?: {
    includePath?: (string | string[])[];
    excludePath?: (string | string[])[];
}): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
