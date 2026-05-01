function words(x) {
    return x.split(" ")
}

function sentence(x) {
    return x.join(" ")
}

function yell(x) {
    return x.toUpperCase()
}
function whisper(x) {
    return `*${x.toLowerCase()}*`;
}

function capitalize(x) {
    return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
}