export const delegate = (anotherPropertyKey: string | symbol) => (
  target: object
) => {
  return {
    set(this: any, value: any) {
      this[anotherPropertyKey] = value;
    },
    get(this: any) {
      return this[anotherPropertyKey];
    },
  };
};
