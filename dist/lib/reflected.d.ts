import { PipeTransform, Type } from "@nestjs/common";
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
export declare const returns: unique symbol;
export declare const nestLoggedMetadata: unique symbol;
export declare function InjectLogger(target: any, propertyKey: string | symbol, parameterIndex: number): void;
type ParameterDecoratorType = (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
type LoggedParamReturns = (name: string, options?: IncludeExcludePath) => ParameterDecoratorType;
export declare const Logged: LoggedParamReturns;
type Pipe = Type<PipeTransform> | PipeTransform;
export declare function LoggedParam(): LoggedParamReturns;
export declare function LoggedParam(...pipes: Pipe[]): LoggedParamReturns;
export declare function LoggedParam(property: string, ...pipes: Pipe[]): LoggedParamReturns;
export declare function LoggedQuery(): LoggedParamReturns;
export declare function LoggedQuery(...pipes: Pipe[]): LoggedParamReturns;
export declare function LoggedQuery(property: string, ...pipes: Pipe[]): LoggedParamReturns;
export declare function LoggedBody(): LoggedParamReturns;
export declare function LoggedBody(...pipes: Pipe[]): LoggedParamReturns;
export declare function LoggedBody(property: string, ...pipes: Pipe[]): LoggedParamReturns;
export declare function LoggedHeaders(property?: string): LoggedParamReturns;
export declare function Returns<F extends Array<any>, R>(namePaths?: {
    [name: string]: string;
} | string): (_target: any, _key: string | symbol, descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R> | R>) => void;
export {};
