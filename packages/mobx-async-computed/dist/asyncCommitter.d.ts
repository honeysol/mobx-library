export declare class AsyncCommitter<T> {
    requestId: number;
    commitId: number;
    resolve(promise: Promise<T>): Promise<{
        successed: boolean;
        value?: undefined;
    } | {
        successed: boolean;
        value: T;
    }>;
    run(asyncFunction: () => Promise<T>): Promise<{
        successed: boolean;
        value?: undefined;
    } | {
        successed: boolean;
        value: T;
    }>;
}
