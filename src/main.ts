import Terminal from './terminal';
import reduce from './reducer';
import rebaseFile from './rebase-file';
import keyBindings from './key-bindings';
import { MainArgs, Logger, RebaseState } from './types';

export default async function main(args: MainArgs, logger: Logger, onExit?: (err?: unknown) => void): Promise<void> {

  const file = args.file;

  const terminal = new Terminal(args.term, {
    status: args.status,
    colors: args.colors,
    selectMarker: args.selectMarker,
    alternateScreen: args.alternateScreen,
    keyBindings: await keyBindings(args.keys)
  });
  logger.trapConsole();

  file.read().then((data) => {
    return new Promise<RebaseState | undefined>((resolve, reject) => {
      let state = rebaseFile.toState(data);
      terminal.render(state);
      terminal.addKeyListener((key, param) => {
        try {
          if (key === 'quit') {
            resolve(state);
          } else if (key === 'abort') {
            resolve(undefined);
          } else {
            state = reduce(state, key, param) as RebaseState;
            terminal.render(state, key, param as string);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }).then((state) => {
    return file.write(rebaseFile.toFile(state));
  }).then(() => {
    closeAndExit();
  }).catch((err) => {
    closeAndExit(err);
  });

  function closeAndExit(err?: unknown): void {
    terminal.close();
    logger.untrapConsole();
    if (onExit) {
      onExit(err);
    }
  }
}
