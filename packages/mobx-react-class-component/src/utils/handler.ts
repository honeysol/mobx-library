const keyMap = new Map<string, symbol>();
const handlerAppliedMapKey = Symbol("handlerAppliedMap");

const getKey = (name: string) => {
  if (!keyMap.has(name)) {
    keyMap.set(name, Symbol(name));
  }
  return keyMap.get(name) as symbol;
};

// targetはインスタンス
export const applyHandler = (
  target: any,
  targetKey: any,
  specieKey: symbol,
  handlerName: string,
  ...args: any
) => {
  const handlersKey = getKey(handlerName + "Handler");
  let shouldBeApplied = false;
  for (
    let current = Object.getPrototypeOf(target);
    current;
    current = Object.getPrototypeOf(current)
  ) {
    if (!shouldBeApplied) {
      // 継承されている場合、subclassでのみ初期化を行う。
      if (!Object.prototype.hasOwnProperty.call(current, specieKey)) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(current, targetKey)) {
        break;
      }
      shouldBeApplied = true;
    }
    if (Object.prototype.hasOwnProperty.call(current, handlersKey)) {
      for (const handler of current[handlersKey] || []) {
        handler.apply(target, args);
      }
    }
  }
};

// targetは、classのprototype
export const addHandler = (target: any, handlerName: string, handler: any) => {
  const handlersKey = getKey(handlerName + "Handler");
  if (!Object.prototype.hasOwnProperty.call(target, handlersKey)) {
    target[handlersKey] = [];
  }
  target[handlersKey].push(handler);
};

export const getHandlerAppliedMap = function (this: any) {
  if (!this[handlerAppliedMapKey]) {
    this[handlerAppliedMapKey] = new Set();
  }
  return this[handlerAppliedMapKey] as Set<string | symbol>;
};

export const addInitializer = (
  target: any,
  handler: any,
  propertyKey: string | symbol,
  trigger: "init" | "mounted" = "init"
) => {
  const cancelerKey = Symbol("canceler");

  addHandler(target, trigger, function (this: any) {
    const handlerAppliedMap = getHandlerAppliedMap.call(this);
    if (!handlerAppliedMap.has(propertyKey)) {
      handlerAppliedMap.add(propertyKey);
      this[cancelerKey] = handler.apply(this);
    }
  });
  addHandler(target, "release", function (this: any) {
    this[cancelerKey]?.();
  });
};

export const addTerminator = (target: any, handler: any) => {
  addHandler(target, "release", handler);
};

export const addUpdator = (
  target: any,
  handler: any,
  propertyKey: string | symbol
) => {
  addHandler(target, "update", function (this: any) {
    handler.apply(this);
  });
};
