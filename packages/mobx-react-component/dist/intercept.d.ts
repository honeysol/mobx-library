export declare const _intercept: (handler: Function) => MethodDecorator;
export declare const intercept: ((handler: Function) => MethodDecorator) & {
    isEqual: MethodDecorator;
    computed: (handler: Function) => MethodDecorator;
};
