const vowels = /[aeiou]/i;

function vowelDots(str) {
  return str.replace(/([aeiou])/gi, '$1.');
}
