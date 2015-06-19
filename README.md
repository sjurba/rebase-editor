# rebase-editor
Simple terminal based sequence editor for git interactive rebase.
Written in Node.js, published to npm, uses [terminal-kit](https://github.com/cronvel/terminal-kit).

## Install
     npm install -g rebase-editor
     git config --global sequence.editor rebase-editor

![rebase-editor](https://github.com/sjurba/rebase-editor/raw/master/rebase-editor.gif)
## Usage
The terminal prints out the standard interactive rebase file that git creates, plus some extra command info in the comments.
When using the standard commands, the current lines action changes to the corresponding action:

Commands:
 - p, pick = use commit
 - r, reword = use commit, but edit the commit message
 - e, edit = use commit, but stop for amending
 - s, squash = use commit, but meld into previous commit
 - f, fixup = like "squash", but discard this commit's log message

 >NOTE: `x, exec` command is not supported

Supported extra commands are:
 - Up/Down: Moves cursor between lines
 - u: Moves current line up one position
 - d: Moves current line down one position
 - x: Cut/delete line (Pushes to a clipboard stack)
 - v: Paste (Pops from clipboard stack)
 - q: Quit (Saves rebase file and exits)
 - Ctrl-c: Abort rebase (Deletes all lines from file)

To use a different editor for one time (replace `vi` with your favorite editor):

    GIT_SEQUENCE_EDITOR="vi" git rebase -i master

### Command line arguments
The editor accepts the following command line arguments:
 * -s, --status: Print a status line on top. Useful for debugging custom key maps.
 * -k, --keys: Set a custom keybinding. Must be defined as .json or a module exporting a json object.

### Custom key bindings
The keybindings must be a file that can be required, either json or a node module that exports a simple object.
The specials keys that are supported are defined by terminal-kit.

#### Default key bindings
        {
            "UP": "up",
            "DOWN": "down",
            "u": "moveUp",
            "d": "moveDown",
            "p": "pick",
            "r": "reword",
            "e": "edit",
            "s": "squash",
            "f": "fixup",
            "x": "cut",
            "BACKSPACE": "cut",
            "v": "paste",
            "q": "quit",
            "ENTER": "quit",
            "CTRL_C": "abort",
            "ESCAPE": "abort"
        }



## Made a mistake?
`git reflog` is your friend:
![git-reflog](https://github.com/sjurba/rebase-editor/raw/master/git-reflog.gif)

## Uninstall
    npm remove -g rebase-editor
    git config --global --unset sequence.editor

## Development
>"Sorry no tests.."

For debugging i have a `test` file I have been using.

`node index.js example`

For debugging using git:

`GIT_SEQUENCE_EDITOR="./index.js" git rebase -i master`

## TODO
 - [x] Add support for custom keymap
 - [ ] Support exec command

## Contributions
Contributions and comments are welcome, just make an issue and/or pull req.

## Credits
Thanks to Node.js and the wonderful [terminal-kit project](https://github.com/cronvel/terminal-kit).
