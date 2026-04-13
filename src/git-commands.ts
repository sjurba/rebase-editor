import childProcess from 'child_process';

function ordinal(n: number): string {
  const lastTwoDigits = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${n}th`;
  }
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function isValidCommitHash(hash: string): boolean {
  return /^[0-9A-Fa-f]{4,64}$/.test(hash);
}

export function getFullCommitMessages(hashes: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!hashes.every(isValidCommitHash)) {
      reject(new Error('Invalid commit hash.')); return;
    }
    childProcess.execFile('git', ['log', '--no-walk', '--format=%B%x1E', ...hashes], (err, stdout) => {
      if (err) {
        reject(err); return;
      }
      const messages = stdout
        .replace(/\r/g, '')
        .split('\x1e')
        .map((m) => m.trimEnd())
        .filter((m) => m.length > 0)
        .reverse();
      if (messages.length === 1) {
        resolve(messages[0]); return;
      }
      const parts: string[] = [
        `# This is a combination of ${messages.length} commits`,
        ...messages.flatMap((msg, i) => [`# This is the ${ordinal(i + 1)} commit message:`, '', msg]),
        '',
        '# Please enter the commit message for your changes. Lines starting',
        "# with '#' will be ignored, and an empty message aborts the commit.",
      ];
      resolve(parts.join('\n'));
    });
  });
}
