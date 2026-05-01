function filterValues(obj, callback) {
  const result = {};
  for (const key in obj) {
    if (callback(obj[key], key, obj)) {
      result[key] = obj[key];
    }
  }
  return result;
}

function mapValues(obj, callback) {
  const result = {};
  for (const key in obj) {
    result[key] = callback(obj[key], key, obj);
  }
  return result;
}

function reduceValues(obj, callback, initialValue) {
  let accumulator = initialValue;
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const value = obj[keys[i]];
    if (i === 0 && accumulator === undefined) {
      accumulator = value;
    } else {
      accumulator = callback(accumulator, value, keys[i], obj);
    }
  }
  return accumulator;
}
