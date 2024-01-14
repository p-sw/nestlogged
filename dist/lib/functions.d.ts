export declare const notIncludedSymbol: unique symbol;
export declare function includeOrExcludeObjectSync(ocv: any, paths: string[], currentPath: string[], include: boolean): any;
export declare function objectContainedLoggedSync(ocv: any, options?: {
    include?: string[];
    exclude: string[];
}): string;
export declare function getItemByPathSync(obj: object, path: string | string[]): any;
