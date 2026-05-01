import { readdirSync } from 'fs';
import { resolve, parse } from 'path';

const inputPath = process.argv[2] || '.';
const dirPath = resolve(inputPath);

let files;

try {
    files = readdirSync(dirPath);
} catch (err) {
    console.error("Error reading directory:", err.message);
    process.exit(1);
}

const guests = files
    .map(filename => {
        const name = parse(filename).name;
        const [first, last] = name.split('_');
        if (!first || !last) return null;
        return `${last} ${first}`;
    })
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

guests.forEach((guest, i) => {
    console.log(`${i + 1}. ${guest}`);
});
