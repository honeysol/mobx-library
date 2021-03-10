export const getStoredAnnotation = function(this: any) {
  const storedAnnotationsKey = Object.getOwnPropertySymbols(
    Object.getPrototypeOf(this)
  ).find(key => key.description === "mobx-stored-annotations") as symbol;
  return this[storedAnnotationsKey];
};
