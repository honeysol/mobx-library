import { autorun } from "mobx";
import { resourceCache } from "mobx-resource-cache";

import { delay } from "./delay";

let counter = 0;

class Speeker {
  canceler: NodeJS.Timeout;
  id: number;
  constructor(message: string) {
    this.id = ++counter;
    console.log("speek init", this.id, message);
    this.canceler = setInterval(() => {
      console.log("speek", this.id, message);
    }, 1000);
  }
  close() {
    console.log("close", this.id);
    clearInterval(this.canceler);
  }
}

const cache = resourceCache<Speeker>({
  get(key) {
    return new Speeker(key);
  },
  cleanup(value) {
    value.close();
  },
  retentionTime: 2000,
  allowUntracked: true,
});

console.log(cache.get("100").id);
console.log(cache.get("100").id);

(async () => {
  const canceler = autorun(() => {
    cache.get("100");
  });
  await delay(5000, null);
  console.log("finished");
  canceler();
})();
