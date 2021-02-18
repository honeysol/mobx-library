import { ClassType } from "mobx-initializer";
import React from "react";
export declare const componentStatus: unique symbol;
export declare type ReactComponentType = ClassType<React.Component>;
export declare const component: ClassDecorator & {
    pure: ClassDecorator;
};
