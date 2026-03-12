import childProcess from 'child_process';

export function getFullCommitMessage(sha: string): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.exec(`git log --format=%B -n 1 ${sha}`, (err, stdout) => {
      if (err) {
        return reject(err);
      }
      resolve(stdout.trimEnd());
    });
  });
}
