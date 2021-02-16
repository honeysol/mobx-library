export declare class AsyncCommitter {
    requestId: number;
    commitId: number;
    resolve(promise: any): Promise<{
        successed: boolean;
        value?: undefined;
    } | {
        successed: boolean;
        value: any;
    }>;
    run(asyncFunction: any): Promise<{
        successed: boolean;
        value?: undefined;
    } | {
        successed: boolean;
        value: any;
    }>;
}
