import childProcess from 'child_process';

function ordinal(n: number): string {
  if (n === 1) { return '1st'; }
  if (n === 2) { return '2nd'; }
  if (n === 3) { return '3rd'; }
  return `${n}th`;
}

export function getFullCommitMessages(hashes: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.exec(`git log --no-walk --format=%B%x1E ${hashes.join(' ')}`, (err, stdout) => {
      if (err) {
        return reject(err);
      }
      const messages = stdout.replace(/\r/g, '').split('\x1e')
        .map(m => m.trimEnd())
        .filter(m => m.length > 0)
      if (messages.length === 1) {
        return resolve(messages[0]);
      }
      const parts: string[] = [
        `# This is a combination of ${messages.length} commits`,
        ...messages.flatMap((msg, i) => [
          `# This is the ${ordinal(i + 1)} commit message:`,
          '',
          msg
        ]),
        '',
        '# Please enter the commit message for your changes. Lines starting',
        '# with \'#\' will be ignored, and an empty message aborts the commit.'
      ];
      resolve(parts.join('\n'));
    });
  });
}
