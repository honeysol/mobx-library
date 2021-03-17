import { computed } from "mobx";

const { storedAnnotationKey } = (() => {
  const prototype = {};
  computed(prototype, "dammy");
  const storedAnnotationKey = Object.getOwnPropertySymbols(prototype).find(
    (key) => key.description === "mobx-stored-annotations"
  );
  return { storedAnnotationKey };
})();

export { storedAnnotationKey };
