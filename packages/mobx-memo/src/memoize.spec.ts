import { IReactionDisposer, reaction } from "mobx";
import { memoize } from "mobx-memo";

const wait = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

describe("memoize", () => {
  const close = jest.fn();
  const init = jest.fn();
  const changed = jest.fn();
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

  it("wait", async () => {
    await wait(1000);
  });

  let reactionCanceler: IReactionDisposer;
  it("should call init with tracked", async () => {
    init.mockClear();
    close.mockClear();
    reactionCanceler = reaction(() => getBoxMemoized("test3"), changed);
    expect(init).toBeCalledWith("test3");
    expect(changed).not.toBeCalled();
    expect(close).not.toBeCalled();
  });

  it("should not closes after timeout", async () => {
    await wait(1000);
    expect(close).not.toBeCalled();
  });

  it("should not closes immediately after cancel", async () => {
    reactionCanceler();
    expect(close).not.toBeCalled();
  });

  it("should closes after timeout", async () => {
    await wait(1000);
    expect(close).toBeCalled();
  });

  afterAll(async () => await wait(1000));
});
