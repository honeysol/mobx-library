// Refactored and shortened version of json-stable-stringify

export default (obj: unknown): string => {
  const seen: unknown[] = [];
  const stringify = (node: unknown): string => {
    if (typeof (node as any)?.toJSON === "function") {
      node = (node as any).toJSON();
    }
    if (typeof node === "function" || node === undefined) {
      return "";
    } else if (typeof node !== "object" || node === null) {
      return JSON.stringify(node);
    } else if (Array.isArray(node)) {
      const itemStrings = node.map((item) => stringify(item) || "null");
      return "[" + itemStrings.join(",") + "]";
    } else {
      if (seen.indexOf(node) !== -1) {
        throw new TypeError("Converting circular structure to JSON");
      }
      seen.push(node);
      const fields = (function* () {
        for (const key of Object.keys(node).sort()) {
          const valueString = stringify((node as any)[key]);
          if (valueString) yield JSON.stringify(key) + ":" + valueString;
        }
      })();
      seen.pop();
      return "{" + Array.from(fields).join(",") + "}";
    }
  };
  return stringify(obj);
};
