import childProcess from 'child_process';

export function getFullCommitMessages(hashes: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.exec(`git log --no-walk --format=%B%x1E ${hashes.join(' ')}`, (err, stdout) => {
      if (err) {
        return reject(err);
      }
      const messages = stdout.split('\x1e')
        .map(m => m.trimEnd())
        .filter(m => m.length > 0);
      resolve(messages.join('\n\n'));
    });
  });
}
