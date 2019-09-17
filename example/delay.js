export const delay = (delay, value) => {
  return new Promise(resolved => {
    setTimeout(() => {
      resolved(value);
    }, delay);
  });
};
