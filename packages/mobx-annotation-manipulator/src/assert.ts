export const assert: (
  condition: any,
  message: string,
  object?: any
) => asserts condition = (
  condition: any,
  message: string,
  object?: any
): asserts condition => {
  if (!condition) {
    console.error(message, object);
    throw new Error(message);
  }
};
