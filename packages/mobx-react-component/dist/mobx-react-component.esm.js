import { __decorate, __metadata } from 'tslib';
import { observable, computed, intercept as intercept$1, observe } from 'mobx';
import { combineDecorator, initializer, applyHandlerOnce, parametrizeDecorator, addHandler } from 'mobx-initializer';
import _ from 'lodash-es';
import { randomBytes } from 'crypto';

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

  var component = /*#__PURE__*/function (_target) {
    _inheritsLoose(component, _target);

    function component(props) {
      var _this;

      _this = _target.call(this, props) || this;
      _this[_a] = true;
      applyHandlerOnce(_assertThisInitialized(_this), "stateRegister", props);
      applyHandlerOnce(_assertThisInitialized(_this), "resourceRegister", props);
      return _this;
    }

    var _proto = component.prototype;

    _proto.componentDidMount = function componentDidMount() {
      var _target$prototype$com;

      (_target$prototype$com = _target.prototype.componentDidMount) == null ? void 0 : _target$prototype$com.call(this);
      this[componentStatus] = "mounted";
    };

    _proto.componentWillUnmount = function componentWillUnmount() {
      var _target$prototype$com2;

      (_target$prototype$com2 = _target.prototype.componentWillUnmount) == null ? void 0 : _target$prototype$com2.call(this);
      applyHandlerOnce(this, "release");
    };

    return component;
  }(target);

  _a = componentAppliedFlag;

  __decorate([observable.ref, __metadata("design:type", Object)], component.prototype, "props", void 0);
  return component;
}; // pure componentでは、propの変更があってもstateの変更がない限り、renderされない


var _pureComponent = function _pureComponent(target) {
  var _a, _b;

  if (target.prototype[pureComponentAppliedFlag]) {
    return target;
  }

  return _b = /*#__PURE__*/function (_target2) {
    _inheritsLoose(component, _target2);

    function component() {
      var _this2;

      _this2 = _target2.apply(this, arguments) || this;
      _this2[_a] = true;
      return _this2;
    }

    var _proto2 = component.prototype;

    _proto2.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
      return nextState !== this.state;
    };

    return component;
  }(target), _a = pureComponentAppliedFlag, _b;
};

var component = /*#__PURE__*/combineDecorator(initializer, _component);
component.pure = /*#__PURE__*/combineDecorator(initializer, _component, _pureComponent);

var _intercept = function _intercept(handler) {
  return function (target, fieldName, descriptor) {
    console.log("_intercept", descriptor);
    var cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName);
    addHandler(target, "stateRegister", function (props) {
      this[cancelObserveFieldname] = intercept$1(this, fieldName, handler.bind(this));
    });
    addHandler(target, "release", function (props) {
      this[cancelObserveFieldname]();
    });
    return descriptor;
  };
};
var intercept = /*#__PURE__*/parametrizeDecorator(_intercept, function () {
  return null;
});

intercept.computed = function (handler) {
  return function (target, fieldName, descriptor) {
    var temporaryFieldName = Symbol("temporaryFieldName: " + fieldName);
    return computed(target, fieldName, {
      get: function get() {
        var newValue = descriptor.get.apply(this);
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
  return !_.isEqual(newValue, oldValue);
});

// fieldIdentifierToFunc("foo.bar")({ foo: { bar: 123} }) === 123

var fieldIdentifierToFunc = function fieldIdentifierToFunc(fieldIdentifier) {
  var exp = fieldIdentifier.split(".").map(function (field) {
    return "(a=a[" + JSON.stringify(field) + "])";
  }).join("&&");
  return eval("(function(a){return " + exp + ";})");
};

var createPropDecorator = function createPropDecorator(computedFunc) {
  return parametrizeDecorator(function (propName) {
    return function (target, fieldName, descriptor) {
      var getter = fieldIdentifierToFunc(propName);
      return computedFunc(target, fieldName, {
        get: function get() {
          return getter(this.props);
        }
      });
    };
  }, function (target, fieldName) {
    return fieldName;
  });
};

var prop = /*#__PURE__*/createPropDecorator(computed);
prop.deep = /*#__PURE__*/createPropDecorator(intercept.isEqual);
var propDelegateDecorator = /*#__PURE__*/parametrizeDecorator(function (propName) {
  return function (target, fieldName, descriptor) {
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
}, function (target, fieldName) {
  return fieldName;
});
prop.delegate = propDelegateDecorator;

var _state = function _state(target, fieldName, descriptor) {
  var cancelObserveFieldname = Symbol("_observe_" + fieldName);
  addHandler(target, "stateRegister", function (props) {
    var _this = this;

    this[cancelObserveFieldname] = observe(this, fieldName, function () {
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
  addHandler(target, "release", function (props) {
    this[cancelObserveFieldname]();
  });
  return descriptor;
};

var state = _state;
state.computed = /*#__PURE__*/combineDecorator(computed, _state);
state.computed.struct = /*#__PURE__*/combineDecorator(computed.struct, _state);
state.observable = /*#__PURE__*/combineDecorator(observable.ref, _state);
state.deep = /*#__PURE__*/combineDecorator(observable.deep, _state);
state.shallow = /*#__PURE__*/combineDecorator(observable.shallow, _state);
state.ref = /*#__PURE__*/combineDecorator(observable.ref, _state);
state.struct = /*#__PURE__*/combineDecorator(observable.struct, _state);

var _render = function _render(target, fieldName, descriptor) {
  if (fieldName === "render") {
    var fieldId = fieldName + randomBytes(8).toString("hex");
    Object.defineProperty(target, fieldId, state.computed(target, fieldId, descriptor));
    return {
      configurable: true,
      value: function value() {
        return this[fieldId];
      }
    };
  } else {
    addHandler(target, "init", function (props) {
      this.render = function () {
        return this[fieldName];
      };
    });
    return state.computed(target, fieldName, descriptor);
  }
};

var render = _render;

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
    addHandler(target, "init", function () {
      var _this = this;

      this[wrappedHandlerFieldName] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        _this[fieldName] = handler.apply(_this, args);
      };

      this[cancelObserveFieldname] = observe(this, resourceFieldName, function (change) {
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
    addHandler(target, "release", function () {
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
    computed(target, resourceFieldName, descriptor); // resolved

    delete target[resolvedFieldName];
    return resource({
      on: on,
      off: off,
      handler: handler,
      resourceFieldName: resourceFieldName
    })(target, resolvedFieldName, observable.ref(target, resolvedFieldName, {
      configurable: true,
      writable: true,
      value: null
    }));
  };
};

var _watch = function _watch(watchFieldName) {
  return function (target, fieldName, descriptor) {
    if (!descriptor.value) {
      console.error("decorator errsor", watchFieldName, fieldName, descriptor);
    }

    if (fieldName) {
      var cancelObserveFieldname = Symbol("cancelObserveFieldname: " + fieldName);
      addHandler(target, "stateRegister", function (props) {
        this[cancelObserveFieldname] = observe(this, watchFieldName, descriptor.value.bind(this), true);
      });
      addHandler(target, "release", function (props) {
        this[cancelObserveFieldname]();
      });
    } else {
      var _cancelObserveFieldname = Symbol("cancelObserveFieldname");

      addHandler(target, "stateRegister", function (props) {
        this[_cancelObserveFieldname] = observe(watchFieldName, descriptor.value.bind(this));
      });
      addHandler(target, "release", function (props) {
        this[_cancelObserveFieldname]();
      });
    }
  };
};
var watch = /*#__PURE__*/parametrizeDecorator(_watch, function () {
  return null;
});

export { component, intercept, prop, render, resource, state, watch };
//# sourceMappingURL=mobx-react-component.esm.js.map
