// This code is copied from the source code in the links below:
// https://github.com/firebase/firebase-js-sdk/blob/b3746360f47e7b38bce0df279f0cc370ba717eaf/packages/firestore/src/platform/browser/random_bytes.ts
// https://github.com/firebase/firebase-js-sdk/blob/b3746360f47e7b38bce0df279f0cc370ba717eaf/packages/firestore/src/util/misc.ts#L27

export const newId = (): string => {
  // Alphanumeric characters
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // The largest byte value that is a multiple of `char.length`.
  const maxMultiple = Math.floor(256 / chars.length) * chars.length;
  let autoId = "";
  const targetLength = 20;
  while (autoId.length < targetLength) {
    const bytes = randomBytes(40);
    for (let i = 0; i < bytes.length; ++i) {
      // Only accept values that are [0, maxMultiple), this ensures they can
      // be evenly mapped to indices of `chars` via a modulo operation.
      if (autoId.length < targetLength && bytes[i] < maxMultiple) {
        autoId += chars.charAt(bytes[i] % chars.length);
      }
    }
  }
  return autoId;
};

function randomBytes(nBytes: number): Uint8Array {
  // Polyfills for IE and WebWorker by using `self` and `msCrypto` when `crypto` is not available.
  const crypto =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof self !== "undefined" && (self.crypto || (self as any)["msCrypto"]);
  const bytes = new Uint8Array(nBytes);
  if (crypto && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    // Falls back to Math.random
    for (let i = 0; i < nBytes; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}
