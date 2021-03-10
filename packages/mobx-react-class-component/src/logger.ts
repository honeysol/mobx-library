import { configOption } from "./configure";

export const logger = {
  log(...args: any[]) {
    if (configOption.verbose) {
      console.log(...args);
    }
  },
};
