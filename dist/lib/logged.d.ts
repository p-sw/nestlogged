export declare function LoggedFunction<F extends Array<any>, R>(_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>): void;
export declare function LoggedRoute<F extends Array<any>, R>(route: string): (_target: any, key: string, descriptor: TypedPropertyDescriptor<(...args: F) => Promise<R>>) => void;
//# sourceMappingURL=logged.d.ts.map