function ionOut(str) {
    const regex = /\b\w*t(?=ion)\w*\b/g;
    const matches = str.match(regex) || [];
    return matches.map(word => word.replace('ion', ''));
}
