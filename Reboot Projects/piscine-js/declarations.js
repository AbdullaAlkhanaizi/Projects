const escapeStr = "`\\/\"\'";
const arr = [4, "2"];
const obj = { str: "Meow", num: 1234, bool: false, undef: undefined };
const nested = { arr: [4, undefined, "2"], obj: { str: "Meow", num: 1234, bool: false } };
Object.freeze(arr);
Object.freeze(obj);
Object.freeze(nested);
Object.freeze(nested.obj);
Object.freeze(nested.arr);