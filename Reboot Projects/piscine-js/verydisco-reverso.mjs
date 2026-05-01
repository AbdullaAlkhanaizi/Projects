import { readFileSync } from 'fs';

const fileName = process.argv[2];

if (!fileName) {
    console.log("Please provide a file name as the first argument.");
    process.exit(1);
}

let content;
try {
    content = readFileSync(fileName, 'utf-8').trim();
} catch (err) {
    console.error("Error reading the file:", err.message);
    process.exit(1);
}

function reverseVeryDisco(word) {
    const len = word.length;
    const secondLen = Math.floor(len / 2);
    const firstLen = len - secondLen;

    const first = word.slice(-firstLen);
    const second = word.slice(0, secondLen);

    return first + second;
}

const result = content
    .split(' ')
    .map(reverseVeryDisco)
    .join(' ');

console.log(result);
