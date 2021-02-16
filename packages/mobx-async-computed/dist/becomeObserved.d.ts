export declare const becomeObserved: {
    (handler: any, observingFieldName: any): (target: any, fieldName: any, descriptor: any) => void;
    computed(handler: any): (target: any, fieldName: any, descriptor: any) => any;
    observable(handler: any): (target: any, fieldName: any, descriptor: any) => {
        configurable: boolean;
        get(value: any): any;
        set(value: any): void;
    };
};
