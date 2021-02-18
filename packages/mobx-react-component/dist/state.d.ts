export declare const state: ((target: object, fieldName: string) => void) & {
    computed: MethodDecorator & {
        struct: MethodDecorator;
    };
    observable: MethodDecorator;
    deep: MethodDecorator;
    shallow: MethodDecorator;
    ref: MethodDecorator;
    struct: MethodDecorator;
};
export declare class X {
    x: number;
}
