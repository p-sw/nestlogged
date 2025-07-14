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
      if (file.endsWith('.patch')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

console.log('Importing and applying patches...');

console.log('Cleaning up target directory: nestlogged-fastify/src');
fs.rmSync(targetBase, { recursive: true, force: true });
fs.mkdirSync(targetBase, { recursive: true });

const patchFiles = getAllFiles(patchBase);

if (patchFiles.length === 0) {
  console.log('No patch files found. Nothing to do.');
  process.exit(0);
}

for (const patchFile of patchFiles) {
  const relativePathWithPatchExt = path.relative(patchBase, patchFile);
  const relativePath = relativePathWithPatchExt.slice(0, -'.patch'.length);

  console.log(`Processing ${relativePath}...`);

  const sourceFile = path.join(sourceBase, relativePath);
  const targetFile = path.join(targetBase, relativePath);

  if (!fs.existsSync(sourceFile)) {
    console.error(
      `Error: Source file ${sourceFile} not found for patch ${patchFile}. Aborting.`,
    );
    process.exit(1);
  }

  // 1. Copy original file
  const targetDir = path.dirname(targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`  - Copied source to ${path.relative(root, targetFile)}`);

  // 2. Apply patch
  const sourceContent = fs
    .readFileSync(sourceFile, 'utf-8')
    .replace(/\r\n/g, '\n');
  const patchContent = fs.readFileSync(patchFile, 'utf-8');

  const patchedContent = diff.applyPatch(sourceContent, patchContent);

  if (patchedContent === false) {
    console.error(`  - Error: Failed to apply patch for '${relativePath}'.`);
    // We'll leave the copied file for debugging purposes.
    process.exit(1);
  }

  fs.writeFileSync(targetFile, patchedContent);
  console.log(`  - Applied patch successfully.`);
}

console.log('Patch import and apply complete!');
