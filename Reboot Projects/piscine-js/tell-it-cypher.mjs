import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const [,, inputFile, mode, outputName] = process.argv;

if (!inputFile || (mode !== 'encode' && mode !== 'decode')) {
  console.error('Usage: node tell-it-cypher.mjs <file> <encode|decode> [outputFile.ext]');
  process.exit(1);
}

const inputPath = resolve(inputFile);
const defaultOutput = mode === 'encode' ? 'cypher.txt' : 'clear.txt';
const outputPath = resolve(outputName || defaultOutput);

try {
  const data = await readFile(inputPath, 'utf8');
  const result =
    mode === 'encode'
      ? Buffer.from(data).toString('base64')
      : Buffer.from(data, 'base64').toString('utf8');

  await writeFile(outputPath, result, 'utf8');
  console.log(`✅ ${mode === 'encode' ? 'Encoded' : 'Decoded'} content written to ${outputPath}`);
} catch (err) {
  console.error('❌ Error:', err.message);
}
