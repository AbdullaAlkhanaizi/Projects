function deepCopy(value) {
    if (Array.isArray(value)) {
        return value.map(deepCopy);
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    if (typeof value === 'function') {
        return value;
    }

    if (value !== null && typeof value === 'object') {
        const result = {};
        for (const key in value) {
            if (Object.hasOwn(value, key)) {
                result[key] = deepCopy(value[key]);
            }
        }
        return result;
    }

    return value;
}
