import Terminal from './terminal';
import reduce from './reducer';
import rebaseFile from './rebase-file';
import keyBindings, { rewordKeyBindings } from './key-bindings';
import { getFullCommitMessages as defaultGetFullCommitMessages } from './git-commands';
import { MainArgs, Logger, RebaseState } from './types';

export default async function main(args: MainArgs, logger: Logger, onExit?: (err?: unknown) => void): Promise<void> {
  const file = args.file;
  const rewordMap = await rewordKeyBindings(args.keys);
  const getFullCommitMessages = args.getFullCommitMessages ?? defaultGetFullCommitMessages;

  const terminal = new Terminal(args.term, {
    status: args.status,
    colors: args.colors,
    selectMarker: args.selectMarker,
    alternateScreen: args.alternateScreen,
    keyBindings: await keyBindings(args.keys),
  });
  logger.trapConsole();

  file
    .read()
    .then((data) => {
      return new Promise<RebaseState | undefined>((resolve, reject) => {
        let state = rebaseFile.toState(data);
        terminal.render(state);
        terminal.addKeyListener((key, rawKey) => {
          try {
            if (state.rewordState) {
              const rewordAction = rewordMap[rawKey as string];
              if (rewordAction) {
                state = reduce(state, rewordAction) as RebaseState;
              } else if ((rawKey as string).length === 1) {
                state = reduce(state, 'rewordChar', rawKey) as RebaseState;
              }
              terminal.render(state, key, rawKey as string);
            } else if (key === 'quit') {
              resolve(state);
            } else if (key === 'abort') {
              resolve(undefined);
            } else {
              const prevState = state;
              state = reduce(state, key, rawKey) as RebaseState;
              if (state.rewordState && !prevState.rewordState) {
                const { lineIndex } = state.rewordState;
                const hashes: string[] = [state.lines[lineIndex].hash];
                for (let i = lineIndex + 1; i < state.lines.length; i++) {
                  if (state.lines[i].action === 'squash') {
                    hashes.push(state.lines[i].hash);
                  } else {
                    break;
                  }
                }
                const requestLineIndex = lineIndex;
                getFullCommitMessages(hashes)
                  .then((fullMessage) => {
                    if (state.rewordState && state.rewordState.lineIndex === requestLineIndex) {
                      state = {
                        ...state,
                        rewordState: {
                          ...state.rewordState,
                          message: fullMessage,
                          cursorPos: fullMessage.length,
                          fullMessage,
                        },
                      };
                      terminal.render(state);
                    }
                  })
                  .catch(() => {
                    /* ignore errors, keep short message */
                  });
              }
              terminal.render(state, key, rawKey as string);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    })
    .then((state) => {
      return file.write(rebaseFile.toFile(state));
    })
    .then(() => {
      closeAndExit();
    })
    .catch((err) => {
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
