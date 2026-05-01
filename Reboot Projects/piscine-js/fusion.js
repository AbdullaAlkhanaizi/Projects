function fusion(obj1, obj2) {
    const result = {};

    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of keys) {
        const val1 = obj1[key];
        const val2 = obj2[key];

        if (val1 !== undefined && val2 !== undefined) {
            if (Array.isArray(val1) && Array.isArray(val2)) {
                result[key] = [...val1, ...val2];
            } else if (typeof val1 === 'string' && typeof val2 === 'string') {
                result[key] = val1 + ' ' + val2;
            } else if (typeof val1 === 'number' && typeof val2 === 'number') {
                result[key] = val1 + val2;
            } else if (
                typeof val1 === 'object' && typeof val2 === 'object' && !Array.isArray(val1) && !Array.isArray(val2) && val1 !== null && val2 !== null
            ) {
                result[key] = fusion(val1, val2);
            } else {
                result[key] = val2;
            }
        } else {
            result[key] = val1 !== undefined ? val1 : val2;
        }
    }

    return result;
}
