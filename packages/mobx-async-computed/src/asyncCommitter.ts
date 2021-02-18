export class AsyncCommitter<T> {
  requestId = 0;
  commitId = 0;
  async resolve(promise: Promise<T>) {
    this.requestId += 1;
    const currentRequestId = this.requestId;
    const value = await promise;
    if (currentRequestId <= this.commitId) {
      return { successed: false };
    }
    this.commitId = currentRequestId;
    return { successed: true, value };
  }
  async run(asyncFunction: () => Promise<T>) {
    return this.resolve(asyncFunction());
  }
}
