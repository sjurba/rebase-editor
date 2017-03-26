# rebase-editor
Simple terminal based sequence editor for git interactive rebase.
Written in Node.js, published to npm, uses [terminal-kit](https://github.com/cronvel/terminal-kit).

[![Build Status](https://travis-ci.org/sjurba/rebase-editor.svg?branch=master)](https://travis-ci.org/sjurba/rebase-editor)
[![Coverage Status](https://coveralls.io/repos/github/sjurba/rebase-editor/badge.svg?branch=master)](https://coveralls.io/github/sjurba/rebase-editor?branch=master)

**VERSION 2.0 IS OUT** :sparkles: :camel: :boom:</br>
New features: Select multiple lines, and undo changes!</br>
Check the [changelog](#changelog) for details.

## Install
     npm install -g rebase-editor
     git config --global sequence.editor rebase-editor

 > NOTE: Also works with Yarn: `yarn global add rebase-editor`

## Does it work on...

| Platform | Support |
| -------- | ------- |
| Mac      | Yes     |
| Linux    | Yes     |
| Windows  | Yes, but not Git Bash [(#7)](https://github.com/sjurba/rebase-editor/issues/7) |

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
 - d, drop = remove commit

 >NOTE: `x, exec` command is not supported

Supported extra commands are:
  - DOWN/UP = Moves cursor between lines
  - SHIFT_RIGHT/SHIFT_DOWN = Select one line down
  - SHIFT_LEFT/SHIFT_UP = Select one line up
  - RIGHT/CTRL_DOWN = Moves current line down one position
  - LEFT/CTRL_UP = Moves current line up one position
  - z, CTRL_Z = Undo
  - Z, CTRL_SHIFT_Z = Redo
  - ENTER, q = Save and quit
  - ESC, CTRL_C = Abort

To use a different editor for one time (replace `vi` with your favorite editor):

    GIT_SEQUENCE_EDITOR="vi" git rebase -i master

### Command line arguments
The editor accepts the following command line arguments:
 * -s, --status: Print a status line on top. Useful for debugging custom key maps.
 * -k, --keys: Set a custom keybinding. Must be defined as .json file or a .js file with a module exporting a json object.
 * -c, --color: Use colorful editor output. This argument takes an extra optional argument with custom colors as a comma separated string of [terminal-kit style characters](https://github.com/cronvel/string-kit#ref.format.markup). You can specify 3 colors, first for the line action ('pick', 'squash', etc.), the second for the hash and the third for the message. An empty string means no special color. Ex. (`-c ^r,^y,^b` (red, yellow, blue) or `-c ^r` (Only color action) or `-c ,,^b` (Only color message))
 * -m, --marker: Set a custom marker to mark selected lines. It can be any string like '>> ' or one of the [terminal-kit style characters](https://github.com/cronvel/string-kit#ref.format.markup). The default is '^!' (Inverse) except for windows where that doesn't work [(See #9)](https://github.com/sjurba/rebase-editor/issues/9) which has yellow instead: '^Y'.
 * --no-alternate-screen: Disable alternate screen. [(See #11)[https://github.com/sjurba/rebase-editor/issues/11]]

```
  git config --global sequence.editor "rebase-editor -s -c -m '> ' -k ~/customKeyBindings.json"
```

### Custom key bindings
The keybindings must be a file that can be required, either json or a node module that exports a simple object.
The specials keys that are supported are defined by terminal-kit.

#### Default key bindings
        {
          UP: 'up',
          DOWN: 'down',
          LEFT: 'moveUp',
          CTRL_UP: 'moveUp',
          RIGHT: 'moveDown',
          CTRL_DOWN: 'moveDown',
          SHIFT_LEFT: 'selectUp',
          SHIFT_RIGHT: 'selectDown',
          p: 'pick',
          r: 'reword',
          e: 'edit',
          s: 'squash',
          f: 'fixup',
          d: 'drop',
          BACKSPACE: 'drop',
          DELETE: 'drop',
          z: 'undo',
          CTRL_Z: 'undo',
          Z: 'redo',
          CTRL_SHIFT_Z: 'redo',
          q: 'quit',
          ENTER: 'quit',
          CTRL_C: 'abort',
          ESCAPE: 'abort'
        }


#### A note on key bindings for Mac
>Not all key combinations work on Mac by default. Most notably, no modifier keys work with UP/DOWN (Like SHIFT, CTRL, ALT, META/CMD). Fn works kind of but it translates to PAGE_UP/DOWN. Therefor I decided to use the LEFT/RIGHT combinations as a fallback for Mac. You can however configure your terminal manually. [See #8 for a guide how to do that.](https://github.com/sjurba/rebase-editor/issues/8)
>
> Likewise CMD-Z, CMD-SHIFT-Z does not work either(CMD doesn't work at all really). So I went with simply z,Z for undo redo.

## Made a mistake?
`git reflog` is your friend:
![git-reflog](https://github.com/sjurba/rebase-editor/raw/master/git-reflog.gif)

## Uninstall
    npm remove -g rebase-editor
    git config --global --unset sequence.editor

> Yarn: `yarn global remove rebase-editor`

## Development

### Architecture/Code map
- `index.js` - bootstrap app. Simple and only tested manually.
- `main.js` - glues the app together.
- `rebase-file.js` - reads and write state from a rebase file.
- `key-binding.js` - defines default key bindings.
- `reducer.js` - a redux-inspired reducer. A pure function that takes the old state and an key action and returns a new state object. Remember that the state is immutable (although not enforced).
- `terminal.js` - renders the state to the terminal.
- `file-handle.js` - file util.

### Testing
`npm test` or `npm run tdd`

For debugging I have a test file I have been using.

`node index.js example`

For debugging using git:

`GIT_SEQUENCE_EDITOR="./index.js" git rebase -i master`

## Changelog

### v1.0.0
Initial version

### v2.0.0
Complete rewrite with new architecture and test driven implementation.

#### New features:
 - Line selection. You can now select multiple lines and move or change them together. Use Shift up/down (not on mac), or Shift left/right to make a selection.
 - Highligt line. The selected line(s) is now highlighted.
 - Support the drop command instead of deleting lines.
 - Undo/Redo. You can now undo and redo all changes with z,Z or CTRL_Z, CTRL_SHIFT_Z.
 - Custom colors. You can customize the colors using the -c attribute.

#### Breaking changes:
 - Colors is now opt-in instead of opt-out. With the new line selection I like no colors better.
 - Removed cut'n paste function. Replaced with drop command.
 - Changed default move line key from u and d to CTRL_UP/CTRL_DOWN (not on mac) or LEFT/RIGHT. Can be reverted with custom keymap.

## TODO
 - [ ] Support exec command

 >Or not.. I have never found use for this function anyways, and I'm not sure how I would like the workflow and keymapping to work.

## Contributions
Contributions and comments are welcome, just make an issue and/or pull req.

## Credits
Thanks to Node.js and the wonderful [terminal-kit project](https://github.com/cronvel/terminal-kit).
