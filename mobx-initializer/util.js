export const applyHandler = (target, handlersName, ...args) => {
  const handlersPropertyName = "_" + handlersName + "Handler";
  for (
    let current = target;
    current;
    current = Object.getPrototypeOf(current)
  ) {
    if (current.hasOwnProperty(handlersPropertyName)) {
      for (const handler of current[handlersPropertyName] || []) {
        handler.apply(target, args);
      }
    }
  }
};

export const applyHandlerOnce = (target, handlersName, ...args) => {
  const handlersPropertyName = "_" + handlersName + "Handler";
  const flagPropetyName = handlersPropertyName + "Done";
  if (target[flagPropetyName]) {
    return;
  }
  target[flagPropetyName] = true;
  applyHandler(target, handlersName, ...args);
};

export const addHandler = (target, handlersName, handler) => {
  const handlersPropertyName = "_" + handlersName + "Handler";
  if (!target.hasOwnProperty(handlersPropertyName)) {
    target[handlersPropertyName] = [];
  }
  target[handlersPropertyName].push(handler);
};

const _combineDecorator = (...decorators) => {
  return (_target, fieldName, _descriptor) => {
    if (fieldName) {
      if (typeof fieldName !== "string") {
        console.error(_target, fieldName, _descriptor, decorators);
        debugger;
      }
      const target = _target;
      let descriptor = _descriptor;
      for (const decorator of decorators) {
        descriptor = decorator(target, fieldName, descriptor) || descriptor;
      }
      return descriptor === _descriptor ? null : descriptor;
    } else {
      let target = _target;
      for (const decorator of decorators) {
        target = decorator(target) || target;
      }
      return target === _target ? null : target;
    }
  };
};

export const combineDecorator = (...decorators) => {
  return (target, fieldName, descriptor) => {
    if (
      target.hasOwnProperty("constructor") ||
      target.hasOwnProperty("prototype")
    ) {
      return _combineDecorator(
        ...decorators.map(decorator =>
          decorator[isAcceptable] ? decorator.decorator : decorator
        )
      )(target, fieldName, descriptor);
    } else {
      return _combineDecorator(
        ...decorators.map(decorator =>
          decorator[isAcceptable] ? decorator.decorator(target) : decorator
        )
      );
    }
  };
};

export const parametrizeDecorator = (decorator, defaultValue) => {
  return (target, fieldName, descriptor) => {
    if (
      target.hasOwnProperty("constructor") ||
      target.hasOwnProperty("prototype")
    ) {
      // パラメータがない時
      return decorator(defaultValue(target, fieldName, descriptor))(
        target,
        fieldName,
        descriptor
      );
    } else {
      // パラメータが与えられた時
      return decorator(target);
    }
  };
};

const isAcceptable = Symbol("isAcceptable");

export const acceptParams = decorator => ({
  decorator,
  [isAcceptable]: true,
});

export const componentStatus = Symbol("componentStatus");
