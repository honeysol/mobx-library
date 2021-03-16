import { computed } from "mobx";

const { storedAnnotationKey } = (() => {
  class C {
    @computed
    get dammy() {
      return null;
    }
  }
  const storedAnnotationKey = Object.getOwnPropertySymbols(C.prototype).find(
    (key) => key.description === "mobx-stored-annotations"
  );
  return { storedAnnotationKey };
})();

export { storedAnnotationKey };
