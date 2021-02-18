declare type handlerType<T> = keyof T | (() => () => void);
export declare const becomeObserved: {
    <T>(handler: handlerType<T>, observingFieldName: string): (target: T, fieldName: string, descriptor: PropertyDescriptor) => void;
    computed<T_1>(handler: handlerType<T_1>): (target: T_1, fieldName: string, descriptor: PropertyDescriptor) => any;
    observable<T_2>(handler: handlerType<T_2>): (target: T_2, fieldName: string, descriptor: PropertyDescriptor) => {
        configurable: boolean;
        get(this: any): any;
        set(this: any, value: any): void;
    };
};
export {};
