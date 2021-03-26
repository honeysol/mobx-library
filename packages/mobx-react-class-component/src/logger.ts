import { configOption } from "./configure";

export const logger = {
  log(...args: unknown[]): void {
    if (configOption.verbose) {
      console.log(...args);
    }
  },
};
