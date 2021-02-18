export declare const resource: {
    <Resource>({ on, off, handler, resourceFieldName, }: {
        on: (resource: Resource, handler: Function) => void;
        off: (resource: Resource, handler: Function) => void;
        handler: Function;
        resourceFieldName: string;
    }): (target: object, fieldName: string, descriptor: PropertyDescriptor) => void;
    computed<Resource_1>({ on, off, handler, }: {
        on: (resource: Resource_1, handler: Function) => void;
        off: (resource: Resource_1, handler: Function) => void;
        handler: Function;
        resourceFieldName: string;
    }): (target: object, resolvedFieldName: string, descriptor: PropertyDescriptor) => void;
};
