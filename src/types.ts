export interface RebaseLine {
  action: string;
  hash: string;
  message: string;
  originalMessage?: string; // preserved short message for when action is changed away from 'reworded'
}

export interface RewordModeState {
  message: string; // full message being edited (may contain \n)
  originalMessage: string; // message before entering edit mode (for undo/cancel)
  lineIndex: number; // index of the RebaseLine being edited
  cursorPos: number; // character offset within the message string
  selectAnchor?: number; // start of selection; undefined means no selection
  fullMessage?: string; // full commit message fetched from git (async)
}

export interface CursorState {
  pos: number;
  from: number;
}

export type KeyBindings = Record<string, string>;

export type ExtraInfoFn = (keyBindings: KeyBindings) => string[];

export interface RebaseState {
  lines: RebaseLine[];
  cursor: CursorState;
  info: string[];
  height: number;
  extraInfo?: ExtraInfoFn;
  undoStack?: UndoEntry[];
  redoStack?: UndoEntry[];
  rewordState?: RewordModeState;
  [key: string]: unknown;
}

export interface UndoEntry {
  lines: RebaseLine[];
  cursor: CursorState;
}

export interface Logger {
  trapConsole: () => void;
  untrapConsole: () => void;
}

export interface TerminalOpts {
  status?: boolean;
  selectMarker?: string;
  alternateScreen?: boolean;
  keyBindings: KeyBindings;
  colors?: string[];
}

export interface MainArgs {
  file: {
    read(): Promise<string>;
    write(data: string): Promise<void>;
  };
  term: TerminalKitTerminal;
  status?: boolean;
  keys?: string;
  colors?: string[];
  selectMarker?: string;
  alternateScreen?: boolean;
  getFullCommitMessages?: (hashes: string[]) => Promise<string>;
}

// Minimal terminal-kit terminal interface used by this project
export interface TerminalKitTerminal {
  (str: string): TerminalKitTerminal;
  moveTo(col: number, row: number): void;
  eraseLine(): void;
  fullscreen(enabled: boolean): void;
  grabInput(): void;
  hideCursor(hidden: boolean): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  height: number;
  width: number;
}
