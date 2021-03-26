type AsyncCommiterResult<T> =
  | { successed: false; value?: undefined }
  | { successed: true; value: T | undefined };

export class AsyncCommitter<T> {
  requestId = 0;
  commitId = 0;
  async resolve(
    promise: Promise<T | undefined> | T | undefined
  ): Promise<AsyncCommiterResult<T>> {
    this.requestId += 1;
    const currentRequestId = this.requestId;
    const value = await promise;
    if (currentRequestId <= this.commitId) {
      return { successed: false };
    }
    this.commitId = currentRequestId;
    return { successed: true, value };
  }
  async run(asyncFunction: () => Promise<T>): Promise<AsyncCommiterResult<T>> {
    return this.resolve(asyncFunction());
  }
}
