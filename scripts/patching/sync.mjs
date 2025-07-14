import fs, { mkdtempSync } from 'fs';
import path from 'path';
import * as diff from 'diff';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../../');

const sourceBase = path.join(root, 'packages/nestlogged/src');
const targetBase = path.join(root, 'packages/nestlogged-fastify/src');
const patchBase = path.join(root, 'packages/nestlogged-fastify/patch');

const relativeFilePath = process.argv[2];
if (!relativeFilePath) {
  console.error('Error: Relative file path not provided.');
  console.log('Usage: node scripts/patching/sync.mjs <path/to/file.ts>');
  process.exit(1);
}

const sourceFile = path.join(sourceBase, relativeFilePath);
const targetFile = path.join(targetBase, relativeFilePath);
const patchFile = path.join(patchBase, relativeFilePath) + '.patch';

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Source file not found: ${sourceFile}`);
  process.exit(1);
}
if (!fs.existsSync(patchFile)) {
  console.error(`Error: Patch file not found: ${patchFile}`);
  process.exit(1);
}

console.log(`Syncing changes for ${relativeFilePath} using 3-way merge...`);

// Get REMOTE content
const remoteContent = fs
  .readFileSync(sourceFile, 'utf-8')
  .replace(/\r\n/g, '\n');
const patchContent = fs.readFileSync(patchFile, 'utf-8');

// Get BASE content from git HEAD
let baseContent;
try {
  const gitPath = path
    .join('packages/nestlogged/src', relativeFilePath)
    .replace(/\\/g, '/');
  baseContent = execSync(`git show HEAD:"${gitPath}"`, {
    encoding: 'utf-8',
    stdio: 'pipe',
  }).replace(/\r\n/g, '\n');
} catch (e) {
  console.log(
    `  - Note: Could not find ${relativeFilePath} in HEAD. Assuming it's a new file, using empty base.`,
  );
  baseContent = '';
}

// Construct LOCAL content by applying the patch to the BASE
const localContent = diff.applyPatch(baseContent, patchContent);
if (localContent === false) {
  console.error(
    `[FATAL] The patch file ${path.relative(root, patchFile)} does not apply cleanly to the version of the source file in your last commit (HEAD).`,
  );
  console.error(
    'This indicates an inconsistent state. Please resolve this manually before proceeding.',
  );
  process.exit(1);
}

// Use a temporary directory for the merge operation
const tmpDir = mkdtempSync(path.join(tmpdir(), 'patch-sync-'));
const baseTmpFile = path.join(tmpDir, 'base');
const localTmpFile = path.join(tmpDir, 'local');
const remoteTmpFile = path.join(tmpDir, 'remote');

fs.writeFileSync(baseTmpFile, baseContent);
fs.writeFileSync(localTmpFile, localContent);
fs.writeFileSync(remoteTmpFile, remoteContent);

// Perform 3-way merge using git merge-file
let hadConflict = false;
try {
  const localLabel = `Yours (fastify patched - ${relativeFilePath})`;
  const remoteLabel = `Theirs (nestlogged update - ${relativeFilePath})`;

  // git merge-file <current-file> <base-file> <other-file>
  execSync(
    `git merge-file -L "${localLabel}" -L "BASE (HEAD)" -L "${remoteLabel}" "${localTmpFile}" "${baseTmpFile}" "${remoteTmpFile}"`,
    { stdio: 'pipe' },
  );
  console.log(
    '  - Merged without conflicts. Proceeding to auto-export patch...',
  );
} catch (e) {
  // A non-zero exit code indicates conflicts
  hadConflict = true;
  console.error(
    `\n[CONFLICT] Merge conflict detected for '${relativeFilePath}'.`,
  );
  console.error(
    'The target file has been written with conflict markers (<<<<<<<, =======, >>>>>>>).',
  );
  console.log('\nPlease resolve the conflicts by:');
  console.log(
    `  1. Editing the target file: ${path.relative(root, targetFile)}`,
  );
  console.log(
    `  2. After resolving, run 'pnpm run patch:export' to create a new, correct patch file.`,
  );
} finally {
  const finalContent = fs.readFileSync(localTmpFile, 'utf-8');
  const targetDir = path.dirname(targetFile);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetFile, finalContent);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

if (!hadConflict) {
  console.log('  - Exporting new patch file...');

  const newTargetContent = fs.readFileSync(targetFile, 'utf-8');

  const newPatchContent = diff.createPatch(
    path
      .join('packages/nestlogged-fastify/src', relativeFilePath)
      .replace(/\\/g, '/'),
    remoteContent, // This is the new source content, already read and normalized
    newTargetContent,
  );

  fs.writeFileSync(patchFile, newPatchContent);
  console.log(
    `\n✅ Sync and export successful! The file '${relativeFilePath}' and its patch are now up-to-date.`,
  );
}

if (hadConflict) {
  process.exit(1); // Exit with error code to signify conflict
}
