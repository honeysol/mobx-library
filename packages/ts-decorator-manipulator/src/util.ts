export const getDerivedPropertyKey = (
  baseKey: string | symbol,
  suffix: string
) =>
  Symbol(
    `${typeof baseKey === "symbol" ? baseKey.description : baseKey}->${suffix}`
  );

let counter = 0;

export const getDerivedPropertyString = (
  baseKey: string | symbol,
  suffix: string
) =>
  `${
    typeof baseKey === "symbol" ? baseKey.description : baseKey
  }${++counter}->${suffix}`;
