'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

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

var applyHandler = function applyHandler(target, handlersName) {
  var handlersPropertyName = "_" + handlersName + "Handler";

  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  for (var current = target; current; current = Object.getPrototypeOf(current)) {
    if (current.hasOwnProperty(handlersPropertyName)) {
      for (var _iterator = _createForOfIteratorHelperLoose(current[handlersPropertyName] || []), _step; !(_step = _iterator()).done;) {
        var handler = _step.value;
        handler.apply(target, args);
      }
    }
  }
};
var applyHandlerOnce = function applyHandlerOnce(target, handlersName) {
  var handlersPropertyName = "_" + handlersName + "Handler";
  var flagPropetyName = handlersPropertyName + "Done";

  if (target[flagPropetyName]) {
    return;
  }

  target[flagPropetyName] = true;

  for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    args[_key2 - 2] = arguments[_key2];
  }

  applyHandler.apply(void 0, [target, handlersName].concat(args));
};
var addHandler = function addHandler(target, handlersName, handler) {
  var handlersPropertyName = "_" + handlersName + "Handler";

  if (!target.hasOwnProperty(handlersPropertyName)) {
    target[handlersPropertyName] = [];
  }

  target[handlersPropertyName].push(handler);
};

var _combineDecorator = function _combineDecorator() {
  for (var _len3 = arguments.length, decorators = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    decorators[_key3] = arguments[_key3];
  }

  return function (_target, fieldName, _descriptor) {
    if (fieldName) {
      if (typeof fieldName !== "string") {
        console.error(_target, fieldName, _descriptor, decorators);
        debugger;
      }

      var target = _target;
      var descriptor = _descriptor;

      for (var _iterator2 = _createForOfIteratorHelperLoose(decorators), _step2; !(_step2 = _iterator2()).done;) {
        var decorator = _step2.value;
        descriptor = decorator(target, fieldName, descriptor) || descriptor;
      }

      return descriptor === _descriptor ? null : descriptor;
    } else {
      var _target2 = _target;

      for (var _iterator3 = _createForOfIteratorHelperLoose(decorators), _step3; !(_step3 = _iterator3()).done;) {
        var _decorator = _step3.value;
        _target2 = _decorator(_target2) || _target2;
      }

      return _target2 === _target ? null : _target2;
    }
  };
};

var combineDecorator = function combineDecorator() {
  for (var _len4 = arguments.length, decorators = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    decorators[_key4] = arguments[_key4];
  }

  return function (target) {
    for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      args[_key5 - 1] = arguments[_key5];
    }

    if (target.hasOwnProperty("constructor") || target.hasOwnProperty("prototype")) {
      var fieldName = args[0],
          descriptor = args[1];
      return _combineDecorator.apply(void 0, decorators.map(function (decorator) {
        return decorator[isAcceptable] ? decorator.decorator : decorator;
      }))(target, fieldName, descriptor);
    } else {
      return _combineDecorator.apply(void 0, decorators.map(function (decorator) {
        return decorator[isAcceptable] ? decorator.decorator.apply(decorator, [target].concat(args)) : decorator;
      }));
    }
  };
};
var parametrizeDecorator = function parametrizeDecorator(decorator, defaultValue) {
  return function (target) {
    for (var _len6 = arguments.length, args = new Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
      args[_key6 - 1] = arguments[_key6];
    }

    if (target.hasOwnProperty("constructor") || target.hasOwnProperty("prototype")) {
      // パラメータがない時
      return decorator(defaultValue.apply(void 0, [target].concat(args))).apply(void 0, [target].concat(args));
    } else {
      // パラメータが与えられた時
      return decorator.apply(void 0, [target].concat(args));
    }
  };
};
var isAcceptable = /*#__PURE__*/Symbol("isAcceptable");
var acceptParams = function acceptParams(decorator) {
  var _ref;

  return _ref = {
    decorator: decorator
  }, _ref[isAcceptable] = true, _ref;
};

var appliedFlag = /*#__PURE__*/Symbol("isAppliedMobxInitializer");
var initializer = function initializer(target) {
  var _a, _b;

  if (target.prototype[appliedFlag]) {
    return target;
  }

  return _b = /*#__PURE__*/function (_target) {
    _inheritsLoose(initializer, _target);

    function initializer(props) {
      var _this;

      _this = _target.call(this, props) || this;
      _this[_a] = true;
      applyHandlerOnce(_assertThisInitialized(_this), "init", props);
      return _this;
    }

    return initializer;
  }(target), _a = appliedFlag, _b;
};

exports.acceptParams = acceptParams;
exports.addHandler = addHandler;
exports.applyHandler = applyHandler;
exports.applyHandlerOnce = applyHandlerOnce;
exports.combineDecorator = combineDecorator;
exports.initializer = initializer;
exports.parametrizeDecorator = parametrizeDecorator;
//# sourceMappingURL=mobx-initializer.cjs.development.js.map
