function replica(target, ...sources) {
    for (const source of sources) {
        if (source && typeof source === 'object') {
            for (const key in source) {
                if (Object.hasOwn(source, key)) {
                    const sourceVal = source[key];
                    const targetVal = target[key];

                    const isObject = val =>
                        val && typeof val === 'object' && !(val instanceof RegExp) && !(val instanceof Date) && !(typeof val === 'function');

                    if (isObject(sourceVal)) {
                        if (
                            Array.isArray(sourceVal) ||
                            !isObject(targetVal) ||
                            Array.isArray(targetVal)
                        ) {
                            target[key] = deepCopy(sourceVal);
                        } else {
                            target[key] = targetVal || {};
                            replica(target[key], sourceVal);
                        }
                    } else {
                        target[key] = deepCopy(sourceVal);
                    }
                }
            }
        }
    }
    return target;
}

function deepCopy(value) {
    if (Array.isArray(value)) {
        return value.map(deepCopy);
    }
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }
    if (value instanceof Date) {
        return new Date(value.getTime());
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
