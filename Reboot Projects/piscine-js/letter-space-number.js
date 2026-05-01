function letterSpaceNumber(str) {
  const regex = /[a-zA-Z] \d(?![\da-zA-Z])/g;
  return str.match(regex) || [];
}
