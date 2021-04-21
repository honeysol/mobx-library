import { observable } from "mobx";
import { memoize } from "mobx-memo";

describe("memoize", () => {
  const fetch = jest.fn().mockResolvedValue("test");
  const close = jest.fn();
  class MobXFetch<T> {
    @observable promise: Promise<T> | T;
    constructor(url: string) {
      this.promise = fetch(url);
    }
    close() {
      close();
    }
  }
  const mobxFetch = (url: string) => new MobXFetch<unknown>(url);
  // As function
  const memoizedFetch = memoize({
    retentionTime: 500,
    cleanup: (item: MobXFetch<unknown>) => {
      item.close();
    },
    allowUntracked: true,
  })(mobxFetch);

  it("returns a result", async () => {
    const res = await memoizedFetch("https://localhost/test").promise;
    expect(fetch).toBeCalledWith("https://localhost/test");
    expect(res).toEqual("test");
  });

  it("caches a result", async () => {
    fetch.mockClear();
    await memoizedFetch("https://localhost/test").promise;
    expect(fetch).not.toBeCalled();
    expect(close).not.toBeCalled();
  });

  it("clears a cache", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await memoizedFetch("https://localhost/test").promise;
    expect(fetch).toBeCalledWith("https://localhost/test");
    expect(close).toBeCalledTimes(1);
  });

  it("returns an other result", async () => {
    fetch.mockClear();
    await memoizedFetch("https://localhost/test2").promise;
    expect(fetch).toBeCalledWith("https://localhost/test2");
  });

  afterAll(
    async () => await new Promise((resolve) => setTimeout(resolve, 1000))
  );
});
