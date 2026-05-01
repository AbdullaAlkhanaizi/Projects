function pick(obj, keys) {
    const result = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keyArray) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = obj[key];
        }
    }

    return result;
}

function omit(obj, keys) {
    const result = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && !keyArray.includes(key)) {
            result[key] = obj[key];
        }
    }

    return result;
}
