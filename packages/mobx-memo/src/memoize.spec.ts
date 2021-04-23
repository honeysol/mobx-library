import { memoize } from "mobx-memo";

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

describe("memoize with untracked value", () => {
  const close = jest.fn();
  const init = jest.fn();
  class Box<T> {
    value: T;
    constructor(value: T) {
      init(value);
      this.value = value;
    }
    close() {
      close();
    }
  }
  const getBox = (value: string) => new Box<string>(value);
  // As function
  const getBoxMemoized = memoize({
    retentionTime: 500,
    cleanup: (item: Box<string>) => {
      item.close();
    },
    allowUntracked: true,
  })(getBox);

  it("returns a result", async () => {
    const res = getBoxMemoized("test").value;
    expect(init).toBeCalledWith("test");
    expect(res).toEqual("test");
  });

  it("caches a result", async () => {
    init.mockClear();
    getBoxMemoized("test").value;
    expect(init).not.toBeCalled();
    expect(close).not.toBeCalled();
  });

  it("clears a cache", async () => {
    await wait(1000);
    getBoxMemoized("test").value;
    expect(init).toBeCalledWith("test");
    expect(close).toBeCalledTimes(1);
  });

  it("returns an other result", async () => {
    init.mockClear();
    getBoxMemoized("test2").value;
    expect(init).toBeCalledWith("test2");
  });

  afterAll(
    async () => await new Promise((resolve) => setTimeout(resolve, 1000))
  );
});
