import fs from 'fs';
import path from 'path';
import * as diff from 'diff';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../../');

const sourceBase = path.join(root, 'packages/nestlogged/src');
const targetBase = path.join(root, 'packages/nestlogged-fastify/src');
const patchBase = path.join(root, 'packages/nestlogged-fastify/patch');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

console.log('Exporting patches...');

const targetFiles = getAllFiles(targetBase);

if (targetFiles.length === 0) {
  console.log(
    'No files found in nestlogged-fastify/src to export from. Nothing to do.',
  );
  process.exit(0);
}

for (const targetFile of targetFiles) {
  const relativePath = path.relative(targetBase, targetFile);
  const sourceFile = path.join(sourceBase, relativePath);
  const patchFile = path.join(patchBase, relativePath) + '.patch';

  if (!fs.existsSync(sourceFile)) {
    console.warn(
      `Warning: Source file not found for ${relativePath}, skipping.`,
    );
    continue;
  }

  console.log(`Creating patch for ${relativePath}...`);

  const sourceContent = fs
    .readFileSync(sourceFile, 'utf-8')
    .replace(/\r\n/g, '\n');
  const targetContent = fs
    .readFileSync(targetFile, 'utf-8')
    .replace(/\r\n/g, '\n');

  if (sourceContent === targetContent) {
    console.log(
      `  - No changes detected. Checking for existing patch to remove...`,
    );
    if (fs.existsSync(patchFile)) {
      fs.unlinkSync(patchFile);
      console.log(`  - Removed obsolete patch file: ${patchFile}`);
    }
    continue;
  }

  const patchContent = diff.createPatch(
    path.join('packages/nestlogged-fastify/src', relativePath),
    sourceContent,
    targetContent,
  );

  const patchDir = path.dirname(patchFile);
  if (!fs.existsSync(patchDir)) {
    fs.mkdirSync(patchDir, { recursive: true });
  }

  fs.writeFileSync(patchFile, patchContent);
  console.log(
    `  - Patch file created/updated: ${path.relative(root, patchFile)}`,
  );
}

console.log('Patch export complete!');
