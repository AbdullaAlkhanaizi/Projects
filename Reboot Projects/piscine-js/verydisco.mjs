const input = process.argv[2];

if (!input) {
  console.log("Please provide a word or sentence as argument.");
  process.exit(1);
}

function veryDisco(word) {
  const mid = Math.ceil(word.length / 2);
  const first = word.slice(0, mid);
  const second = word.slice(mid);
  return second + first;
}

const result = input
  .split(' ')
  .map(veryDisco)
  .join(' ');

console.log(result);
