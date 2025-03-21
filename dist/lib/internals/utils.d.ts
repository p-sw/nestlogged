export declare const notIncludedSymbol: unique symbol;
export declare function includeObjectSync(ocv: any, opt: {
    paths: string[];
}): any;
export declare function excludeObjectSync(ocv: any, opt: {
    paths: string[];
}): any;
export declare function objectContainedLogSync(ocv: any, options?: {
    include?: string[];
    exclude?: string[];
}): string;
export declare function getItemByPathSync(obj: object, path: string | string[]): any;
