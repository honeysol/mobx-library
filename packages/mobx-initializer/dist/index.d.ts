export * from "./class";
export * from "./method";
export * from "./property";
export declare const applyHandler: <T>(target: any, handlersName: string, ...args: any) => void;
export declare const addHandler: (target: any, handlersName: string, handler: any) => void;
