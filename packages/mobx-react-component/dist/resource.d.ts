export declare const resource: {
    ({ on, off, handler, resourceFieldName, }: {
        on: any;
        off: any;
        handler?: (value: any) => any;
        resourceFieldName: any;
    }): (target: any, fieldName: any, descriptor: any) => void;
    computed({ on, off, handler }: {
        on: any;
        off: any;
        handler?: (value: any) => any;
    }): (target: any, resolvedFieldName: any, descriptor: any) => void;
};
