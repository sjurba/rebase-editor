# rebase-editor
Simple terminal based sequence editor for git interactive rebase.
Written in Node.js, published to npm, uses [terminal-kit](https://github.com/cronvel/terminal-kit).

## Install
     npm install -g rebase-editor
     git config --global sequence.editor rebase-editor

## Uninstall
    npm remove -g rebase-editor
    git config --global --unset sequence.editor

![Usage demo](https://github.com/sjurba/rebase-editor/raw/master/rebase-editor.gif)

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

## Contributions
Contributions and comments are welcome, just make an issue and/or pull req.

## Development
>"Sorry no tests.."

For debugging i have a `test` file I have been using.

`node index.js test`

For debugging using git:

`GIT_SEQUENCE_EDITOR="./index.js" git rebase -i master`
