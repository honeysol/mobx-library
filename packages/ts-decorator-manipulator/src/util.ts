export const getDerivedPropertyKey = (
  baseKey: string | symbol | number,
  suffix: string
) =>
  Symbol(
    `${typeof baseKey === "symbol" ? baseKey.description : baseKey}->${suffix}`
  );

let counter = 0;

export const getDerivedPropertyString = (
  baseKey: string | symbol | number,
  suffix: string
) =>
  `${
    typeof baseKey === "symbol" ? baseKey.description : baseKey
  }#${++counter}->${suffix}`;
