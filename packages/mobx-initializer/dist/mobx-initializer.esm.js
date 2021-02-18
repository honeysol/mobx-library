function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it;

  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      return function () {
        if (i >= o.length) return {
          done: true
        };
        return {
          done: false,
          value: o[i++]
        };
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  it = o[Symbol.iterator]();
  return it.next.bind(it);
}

var combineClassDecorator = function combineClassDecorator() {
  for (var _len = arguments.length, decorators = new Array(_len), _key = 0; _key < _len; _key++) {
    decorators[_key] = arguments[_key];
  }

  return function (target) {
    var current = target;

    for (var _iterator = _createForOfIteratorHelperLoose(decorators), _step; !(_step = _iterator()).done;) {
      var decorator = _step.value;
      current = decorator(current) || current;
    }

    return current === target ? undefined : current;
  };
};

var combineMethodDecorator = function combineMethodDecorator() {
  for (var _len = arguments.length, decorators = new Array(_len), _key = 0; _key < _len; _key++) {
    decorators[_key] = arguments[_key];
  }

  return function (_target, fieldName, _descriptor) {
    var target = _target;
    var descriptor = _descriptor;

    for (var _iterator = _createForOfIteratorHelperLoose(decorators), _step; !(_step = _iterator()).done;) {
      var decorator = _step.value;
      descriptor = decorator(target, fieldName, descriptor) || descriptor;
    } //return descriptor === _descriptor ? undefined : descriptor;

  };
};

var isClass = function isClass(target) {
  return typeof target === "object" && Object.prototype.hasOwnProperty.call(target, "constructor");
};

var parametrizeMethodDecorator = function parametrizeMethodDecorator(decoratorFactory, defaultValue) {
  return function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    if (isClass(args[0])) {
      // without parameter
      var target = args[0],
          fieldName = args[1],
          descriptor = args[2];
      return decoratorFactory(defaultValue(target, fieldName, descriptor))(target, fieldName, descriptor);
    } else {
      // with parameter
      var params = args[0];
      return decoratorFactory(params);
    }
  };
};

var combinePropertyDecorator = function combinePropertyDecorator() {
  for (var _len = arguments.length, decorators = new Array(_len), _key = 0; _key < _len; _key++) {
    decorators[_key] = arguments[_key];
  }

  return function (_target, fieldName, descriptor) {
    var target = _target;

    for (var _iterator = _createForOfIteratorHelperLoose(decorators), _step; !(_step = _iterator()).done;) {
      var decorator = _step.value;
      decorator(target, fieldName, descriptor);
    } //return descriptor === _descriptor ? undefined : descriptor;

  };
};

var isClass$1 = function isClass(target) {
  return typeof target === "object" && Object.prototype.hasOwnProperty.call(target, "constructor");
};

var parametrizePropertyDecorator = function parametrizePropertyDecorator(decoratorGenerator, defaultValue) {
  return function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    if (isClass$1(args[0])) {
      // without parameter
      var target = args[0],
          fieldName = args[1],
          descriptor = args[2];
      return decoratorGenerator(defaultValue(target, fieldName, descriptor))(target, fieldName);
    } else {
      // with parameter
      var params = args[0];
      return decoratorGenerator(params);
    }
  };
};

var applyHandler = function applyHandler(target, handlersName) {
  var handlersPropertyName = "_" + handlersName + "Handler";
  var flagPropetyName = handlersPropertyName + "Done";

  if (target[flagPropetyName]) {
    return;
  }

  target[flagPropetyName] = true;

  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  for (var current = target; current; current = Object.getPrototypeOf(current)) {
    if (Object.prototype.hasOwnProperty.call(current, handlersPropertyName)) {
      for (var _iterator = _createForOfIteratorHelperLoose(current[handlersPropertyName] || []), _step; !(_step = _iterator()).done;) {
        var handler = _step.value;
        handler.apply(target, args);
      }
    }
  }
};
var addHandler = function addHandler(target, handlersName, handler) {
  var handlersPropertyName = "_" + handlersName + "Handler";

  if (!Object.prototype.hasOwnProperty.call(target, handlersPropertyName)) {
    target[handlersPropertyName] = [];
  }

  target[handlersPropertyName].push(handler);
};

export { addHandler, applyHandler, combineClassDecorator, combineMethodDecorator, combinePropertyDecorator, parametrizeMethodDecorator, parametrizePropertyDecorator };
//# sourceMappingURL=mobx-initializer.esm.js.map
