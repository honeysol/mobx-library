export * from "./class";
export * from "./method";
export * from "./property";

export const applyHandler = <T>(
  target: any,
  handlersName: string,
  ...args: any
) => {
  const handlersPropertyName = "_" + handlersName + "Handler";
  const flagPropetyName = handlersPropertyName + "Done";
  if (target[flagPropetyName]) {
    return;
  }
  target[flagPropetyName] = true;
  for (
    let current = target;
    current;
    current = Object.getPrototypeOf(current)
  ) {
    if (Object.prototype.hasOwnProperty.call(current, handlersPropertyName)) {
      for (const handler of current[handlersPropertyName] || []) {
        handler.apply(target, args);
      }
    }
  }
};

export const addHandler = (target: any, handlersName: string, handler: any) => {
  const handlersPropertyName = "_" + handlersName + "Handler";
  if (!Object.prototype.hasOwnProperty.call(target, handlersPropertyName)) {
    target[handlersPropertyName] = [];
  }
  target[handlersPropertyName].push(handler);
};
