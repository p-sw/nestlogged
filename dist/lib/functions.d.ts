export declare const notIncludedSymbol: unique symbol;
export declare function includeOrExcludeObject(ocv: any, paths: string[], currentPath: string[], include: boolean): any;
export declare function includeOrExcludeObjectSync(ocv: any, paths: string[], currentPath: string[], include: boolean): any;
export default function objectContainedLogged(ocv: any, options?: {
    include?: string[];
    exclude: string[];
}): Promise<string>;
export declare function objectContainedLoggedSync(ocv: any, options?: {
    include?: string[];
    exclude: string[];
}): string;
export declare function getItemByPath(obj: object, path: string | string[]): any;
export declare function getItemByPathSync(obj: object, path: string | string[]): any;
