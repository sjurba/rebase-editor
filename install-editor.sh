#!/bin/bash

current=$(git config --get sequence.editor)

if [ "$current" = "rebase-editor" ]; then
  echo "Already installed"
  exit 0
fi

function prompt() {
  echo -n "Do you want to install rebase-editor as global sequence.editor? [yes or no]: "
read yno
case $yno in

        [yY] | [yY][Ee][Ss] )
                return 0
                ;;

        [nN] | [nN][oO] )
                echo "Won't install";
                exit 1
                ;;
        *) echo "Invalid response"
            prompt
            ;;
esac
}

prompt

echo "Installing rebase-editor globally."
echo "To uninstall edit ~/.gitconfig or run git config --unset sequence.editor "
git config sequence.editor rebase-editor
