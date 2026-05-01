function slice(input, start, end) {
    const length = input.length;

    let from = start < 0 ? Math.max(length + start, 0) : start;
    let to = end == null ? length : (end < 0 ? Math.max(length + end, 0) : end);

    from = Math.min(Math.max(from, 0), length);
    to = Math.min(Math.max(to, 0), length);

    let result = Array.isArray(input) ? [] : "";

    for (let i = from; i < to; i++) {
        if (Array.isArray(input)) {
            result.push(input[i]);
        } else {
            result += input[i];
        }
    }

    return result;
}
