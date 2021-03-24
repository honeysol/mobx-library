import { autorun } from "mobx";
import { ResourceCache } from "mobx-resource-cache";

import { delay } from "./delay";

console.log("####");

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
    clearInterval(this.canceler);
  }
}

const cache = new ResourceCache<Speeker>({
  generatorFn(key) {
    return new Speeker(key);
  },
  cleanUpFn(value) {
    value.close();
  },
  delay: 2000,
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
