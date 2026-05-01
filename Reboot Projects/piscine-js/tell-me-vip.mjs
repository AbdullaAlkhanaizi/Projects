import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve, join, parse } from 'path';

const inputDir = process.argv[2] || '.';
const dirPath = resolve(inputDir);

try {
    const files = await readdir(dirPath);

    const guestPromises = files.map(async (file) => {
        const { name, ext } = parse(file);
        if (!name.includes('_') || ext !== '.json') return null;

        const [first, last] = name.split('_');
        const filePath = join(dirPath, file);

        try {
            const content = await readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            if (data.answer?.toLowerCase() === 'yes') {
                return `${last} ${first}`;
            }
        } catch {
            return null;
        }
    });

    const guests = (await Promise.all(guestPromises))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    const output = guests.map((name, i) => `${i + 1}. ${name}`).join('\n');

    console.log(output);
    await writeFile('vip.txt', output, 'utf8');

} catch (err) {
    console.error('Error:', err.message);
}
