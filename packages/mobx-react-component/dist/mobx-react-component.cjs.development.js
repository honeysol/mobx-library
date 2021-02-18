'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var tslib = require('tslib');
var mobx = require('mobx');
var mobxInitializer = require('mobx-initializer');
var isEqual = _interopDefault(require('lodash.isequal'));
var crypto = require('crypto');

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

var componentAppliedFlag = /*#__PURE__*/Symbol("isAppliedMobxReactComponentInitializer");
var pureComponentAppliedFlag = /*#__PURE__*/Symbol("isAppliedMobxReactPureComponentInitializer");
var componentStatus = /*#__PURE__*/Symbol("componentStatus");

var _component = function _component(target) {
  var _a;

  if (target.prototype[componentAppliedFlag]) {
    return target;
  }

  var Component = /*#__PURE__*/function (_target) {
    _inheritsLoose(Component, _target);

    function Component(props) {
      var _this;

      _this = _target.call(this, props) || this;
      _this[_a] = true;
      mobxInitializer.applyHandler(_assertThisInitialized(_this), "init", props);
      mobxInitializer.applyHandler(_assertThisInitialized(_this), "stateRegister", props);
      mobxInitializer.applyHandler(_assertThisInitialized(_this), "resourceRegister", props);
      return _this;
    }

    var _proto = Component.prototype;

    _proto.componentDidMount = function componentDidMount() {
      var _target$prototype$com;

      (_target$prototype$com = _target.prototype.componentDidMount) == null ? void 0 : _target$prototype$com.call(this);
      this[componentStatus] = "mounted";
    };

    _proto.componentWillUnmount = function componentWillUnmount() {
      var _target$prototype$com2;

      (_target$prototype$com2 = _target.prototype.componentWillUnmount) == null ? void 0 : _target$prototype$com2.call(this);
      mobxInitializer.applyHandler(this, "release");
    };

    return Component;
  }(target);

  _a = componentAppliedFlag;

  tslib.__decorate([mobx.observable.ref, tslib.__metadata("design:type", Object)], Component.prototype, "props", void 0);

  return Component;
}; // pure componentでは、propの変更があってもstateの変更がない限り、renderされない


var _pureComponent = function _pureComponent(target) {
  var _a, _b;

  if (target.prototype[pureComponentAppliedFlag]) {
    return target;
  }

  return _b = /*#__PURE__*/function (_target2) {
    _inheritsLoose(Component, _target2);

    function Component() {
      var _this2;

      _this2 = _target2.apply(this, arguments) || this;
      _this2[_a] = true;
      return _this2;
    }

    var _proto2 = Component.prototype;

    _proto2.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
      return nextState !== this.state;
    };

    return Component;
  }(target), _a = pureComponentAppliedFlag, _b;
};

var component = _component;
component.pure = /*#__PURE__*/mobxInitializer.combineClassDecorator(_component, _pureComponent);

var _intercept = function _intercept(handler) {
  return function (target, fieldName, descriptor) {
    var cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName.toString());
    mobxInitializer.addHandler(target, "stateRegister", function () {
      this[cancelObserveFieldname] = mobx.intercept(this, fieldName, handler.bind(this));
    });
    mobxInitializer.addHandler(target, "release", function () {
      this[cancelObserveFieldname]();
    });
    return descriptor;
  };
};
var intercept = _intercept;

intercept.computed = function (handler) {
  return function (target, fieldName, descriptor) {
    var temporaryFieldName = Symbol("temporaryFieldName: " + fieldName.toString());
    return mobx.computed(target, fieldName, {
      get: function get() {
        var _descriptor$get;

        var newValue = (_descriptor$get = descriptor.get) == null ? void 0 : _descriptor$get.apply(this);
        var oldValue = this[temporaryFieldName];

        if (handler.call(this, {
          newValue: newValue,
          oldValue: oldValue
        })) {
          this[temporaryFieldName] = newValue;
        }

        return this[temporaryFieldName];
      }
    });
  };
};

intercept.isEqual = /*#__PURE__*/intercept.computed(function (_ref) {
  var newValue = _ref.newValue,
      oldValue = _ref.oldValue;
  return !isEqual(newValue, oldValue);
});

// fieldIdentifierToFunc("foo.bar")({ foo: { bar: 123} }) === 123

var fieldIdentifierToFunc = function fieldIdentifierToFunc(fieldIdentifier) {
  var exp = fieldIdentifier.split(".").map(function (field) {
    return "(a=a[" + JSON.stringify(field) + "])";
  }).join("&&");
  return eval("(function(a){return " + exp + ";})");
};

var createPropDecorator = function createPropDecorator(baseDecorator) {
  return mobxInitializer.parametrizePropertyDecorator(function (propName) {
    return function (target, fieldName) {
      var getter = fieldIdentifierToFunc(propName);
      baseDecorator(target, fieldName, {
        get: function get() {
          return getter(this.props);
        }
      });
    };
  }, function (_target, fieldName) {
    return fieldName;
  });
};

var prop = /*#__PURE__*/createPropDecorator(mobx.computed);
prop.deep = /*#__PURE__*/createPropDecorator(intercept.isEqual);
prop.delegate = /*#__PURE__*/mobxInitializer.parametrizePropertyDecorator(function (propName) {
  return function (target, fieldName) {
    return {
      get: function get() {
        var _this = this;

        return function () {
          var _this$props;

          (_this$props = _this.props)[propName].apply(_this$props, arguments);
        };
      }
    };
  };
}, function (_target, fieldName) {
  return fieldName;
});

var _state = function _state(target, fieldName) {
  var cancelObserveFieldname = Symbol("_observe_" + fieldName);
  mobxInitializer.addHandler(target, "stateRegister", function () {
    var _this = this;

    this[cancelObserveFieldname] = mobx.observe(this, fieldName, function () {
      if (_this[componentStatus] === "mounted") {
        var _this$setState;

        _this.setState((_this$setState = {}, _this$setState[fieldName] = _this[fieldName], _this$setState));
      }
    });
    this.state = this.state || {
      dammy: "###"
    };
    this.state[fieldName] = this[fieldName];
  });
  mobxInitializer.addHandler(target, "release", function () {
    this[cancelObserveFieldname]();
  });
};

var state = _state;
state.computed = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.computed, _state);
state.computed.struct = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.computed.struct, _state);
state.observable = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.observable.ref, _state);
state.deep = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.observable.deep, _state);
state.shallow = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.observable.shallow, _state);
state.ref = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.observable.ref, _state);
state.struct = /*#__PURE__*/mobxInitializer.combinePropertyDecorator(mobx.observable.struct, _state);
var X = function X() {
  this.x = 0;
};

tslib.__decorate([state, tslib.__metadata("design:type", Object)], X.prototype, "x", void 0);

var render = function render(target, fieldName, descriptor) {
  if (fieldName === "render") {
    var fieldId = fieldName + crypto.randomBytes(8).toString("hex");
    state.computed(target, fieldId, {
      get: descriptor.value
    });
    return {
      configurable: true,
      value: function value() {
        return this[fieldId];
      }
    };
  } else {
    state.computed(target, fieldName, {
      get: descriptor.get || descriptor.value
    });
    Object.defineProperty(target, "render", {
      value: function value() {
        return this[fieldName];
      }
    });
  }
};

var defaultHandler = function defaultHandler(value) {
  return value;
}; // Example:
// @resource({
// 	on: (resource, handler) => resource.on("update", handler),
// 	off: (resource, handler) => resource.off("update", handler),
// 	handler: value => value, // or event => event.value
// 	resourceFieldName: "documentResource"
// })
// @observable
// document


var resource = function resource(_ref) {
  var on = _ref.on,
      off = _ref.off,
      _ref$handler = _ref.handler,
      handler = _ref$handler === void 0 ? defaultHandler : _ref$handler,
      resourceFieldName = _ref.resourceFieldName;
  return function (target, fieldName, descriptor) {
    var wrappedHandlerFieldName = Symbol("_" + fieldName + "Handler");
    var cancelObserveFieldname = Symbol("_resource_" + fieldName);
    mobxInitializer.addHandler(target, "init", function () {
      var _this = this;

      this[wrappedHandlerFieldName] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        _this[fieldName] = handler.apply(_this, args);
      };

      this[cancelObserveFieldname] = mobx.observe(this, resourceFieldName, function (change) {
        var oldValue = change.oldValue,
            newValue = change.newValue;

        if (oldValue) {
          off(oldValue, _this[wrappedHandlerFieldName]);
        }

        if (newValue) {
          on(newValue, _this[wrappedHandlerFieldName]);
        }
      }, true);
    });
    mobxInitializer.addHandler(target, "release", function () {
      if (this[resourceFieldName]) {
        off(this[resourceFieldName], this[wrappedHandlerFieldName]);
      }

      this[cancelObserveFieldname]();
    });
  };
};

resource.computed = function (_ref2) {
  var on = _ref2.on,
      off = _ref2.off,
      _ref2$handler = _ref2.handler,
      handler = _ref2$handler === void 0 ? defaultHandler : _ref2$handler;
  return function (target, resolvedFieldName, descriptor) {
    // resource
    var resourceFieldName = resolvedFieldName + "Resource";
    Object.defineProperty(target, resourceFieldName, descriptor);
    mobx.computed(target, resourceFieldName, descriptor); // resolved

    delete target[resolvedFieldName];
    return resource({
      on: on,
      off: off,
      handler: handler,
      resourceFieldName: resourceFieldName
    })(target, resolvedFieldName, mobx.observable.ref(target, resolvedFieldName, {
      configurable: true,
      writable: true,
      value: null
    }));
  };
};

var watch = function watch(watchFieldName) {
  return function (target, fieldName, descriptor) {
    if (!descriptor.value) {
      // eslint-disable-next-line no-console
      console.error("decorator error", watchFieldName, fieldName, descriptor);
    }

    if (fieldName) {
      var cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName);
      mobxInitializer.addHandler(target, "stateRegister", function () {
        this[cancelObserveFieldname] = mobx.observe(this, watchFieldName, descriptor.value.bind(this), true);
      });
      mobxInitializer.addHandler(target, "release", function () {
        this[cancelObserveFieldname]();
      });
    } else {
      var _cancelObserveFieldname = Symbol("cancelObserveFieldname");

      mobxInitializer.addHandler(target, "stateRegister", function () {
        this[_cancelObserveFieldname] = mobx.observe(watchFieldName, descriptor.value.bind(this));
      });
      mobxInitializer.addHandler(target, "release", function () {
        this[_cancelObserveFieldname]();
      });
    }
  };
};

exports.component = component;
exports.intercept = intercept;
exports.prop = prop;
exports.render = render;
exports.resource = resource;
exports.state = state;
exports.watch = watch;
//# sourceMappingURL=mobx-react-component.cjs.development.js.map
