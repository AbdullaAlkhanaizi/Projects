function first(x) {
    return x[0]
};

function last(x) {
    return x[x.length - 1]
};


function kiss(word) {
    return [last(word), first(word)]
}
