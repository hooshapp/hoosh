import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exportRoot = fileURLToPath(new URL('../apps/mobile/dist/', import.meta.url));
const forbiddenMarkers = [
  'disconnect-ui-specimens',
  'RN-01 component specimen',
  'RN05_ACCOUNT_SPECIMEN_ONLY',
  'RN07_PROFILE_SPECIMEN_ONLY',
  'RN08_PROTECTION_SPECIMEN_ONLY',
  'RN09_HOME_SPECIMEN_ONLY',
  'RN09_FIGMA_RECOMMENDATION_ONLY',
  'RN09_LONG_RECOMMENDATION_ONLY',
  'RN09_HOME_TEST_ONLY',
  'RN09B_QUESTS_SPECIMEN_ONLY',
  'RN09B_GYM_ONLY',
  'RN09B_READING_ONLY',
  'RN09B_TEST_ONLY',
  'RN09C_HISTORY_SPECIMEN_ONLY',
  'RN09C_TEST_ONLY',
  'RN09D_SETTINGS_SPECIMEN_ONLY',
  'RN09D_TEST_ONLY',
  'RN09E_EDITOR_ONLY',
  'RN09F_PREFERENCES_ONLY',
  'RN09G_PLAN_ONLY',
];

async function exportedFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? exportedFiles(path) : [path];
    }),
  );
  return groups.flat();
}

// Fail instead of claiming isolation when the real app export was never produced.
if (!(await stat(join(exportRoot, 'index.html'))).isFile()) {
  throw new Error('Build the real Expo app before checking UI preview isolation.');
}
const files = (await exportedFiles(exportRoot)).filter((path) =>
  ['.js', '.html'].includes(extname(path)),
);
if (!files.some((path) => extname(path) === '.js'))
  throw new Error('No application JavaScript export found.');
for (const path of files) {
  const contents = await readFile(path, 'utf8');
  if (forbiddenMarkers.some((marker) => contents.includes(marker))) {
    throw new Error(`Developer UI specimen leaked into the app export: ${path}`);
  }
}
console.log(
  `UI preview isolation passed: ${files.length} app JavaScript/HTML files contain no specimen markers.`,
);
