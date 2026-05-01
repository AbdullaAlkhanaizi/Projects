import { readdirSync } from 'fs';
import { resolve } from 'path';

const inputPath = process.argv[2] || '.';

const dirPath = resolve(inputPath);

let entries;

try {
    entries = readdirSync(dirPath);
} catch (err) {
    console.error("Error reading directory:", err.message);
    process.exit(1);
}

console.log(entries.length);
