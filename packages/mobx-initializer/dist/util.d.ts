export declare const applyHandler: (target: any, handlersName: any, ...args: any[]) => void;
export declare const applyHandlerOnce: (target: any, handlersName: any, ...args: any[]) => void;
export declare const addHandler: (target: any, handlersName: any, handler: any) => void;
export declare const combineDecorator: (...decorators: any[]) => (target: any, ...args: any[]) => any;
export declare const parametrizeDecorator: (decorator: any, defaultValue: any) => (target: any, ...args: any[]) => any;
declare const isAcceptable: unique symbol;
export declare const acceptParams: (decorator: any) => {
    decorator: any;
    [isAcceptable]: boolean;
};
export {};
