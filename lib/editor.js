'use strict';
var term = require( 'terminal-kit' ).terminal;

var input = [];
var deletedInput = [];
var lineNum = 0;
var lastLine;
var debug = true;

var editorCommands = [
  '# Rebase editor specific commands',
  'u = up, move line up',
  'd = down, move line down',
  'x = cut, cut line',
  'v = paste, paste line',
  'q = save and quit',
  'Ctrl-c = abort'
];

function status(stat) {
  if (debug) {
    term.saveCursor() ;
    term.moveTo.bgWhite.black( 1 , 1 ).eraseLine() ;
    term(stat) ;
    term.white.bgBlack() ;
    term.restoreCursor() ;
  }
}

function cropLine(line) {
  return line.slice(0, term.width);
}

function resetTerminal() {
  term.saveCursor();
  term.moveTo(1,debug?2:1);
  lineNum = 0;
  term.eraseDisplayBelow();
  var data = input.map(cropLine).join('\n');
  data = data.replace(/#\s*x, exec.*/, editorCommands.join('\n#  '));
  data = data.split('\n').slice(0, term.height - 1).join('\n');
  status('Status');
  term(data);
  term.restoreCursor();
}

function setData(data) {
    term.fullscreen(true);
    status('Status ');

    input = input.concat(data.split('\n'));
    resetTerminal();
    for (var i = 0; i< input.length; i++) {
      if (input[i] === '') {
        lastLine = i-1;
        break;
      }
    }
}

function replaceLine() {
  term.eraseLine();
  term(cropLine(input[lineNum]));
  term.column(0);
}

function move(lines) {
  term.move(0, lines);
  lineNum += lines;
  // status('Line number: ' + lineNum);
}

function up() {
  if (lineNum>0) {
    move(-1);
  }
}

function down() {
  if (lineNum < lastLine) {
    move(1);
  }
}

function moveLine(dir) {
  var line = input[lineNum];
  input[lineNum] = input[lineNum+dir];
  input[lineNum+dir] = line;
  replaceLine();
  move(dir);
  replaceLine();
}

function moveUp() {
  if (lineNum > 0) {
    moveLine(-1);
  }
}

function moveDown() {
  if (lineNum < lastLine) {
    moveLine(1);
  }
}

function setCommand(cmd) {
  input[lineNum] = input[lineNum].replace(/^[a-z]* /, cmd + ' ');
  replaceLine();
}

function cutLine() {
  var line = input.splice(lineNum, 1);
  deletedInput.push(line);
  term.deleteLine(1);
}

function pasteLine() {
  var line = deletedInput.pop();
  if (line) {
    input.splice(lineNum, 0, line);
    term.insertLine();
    replaceLine();
  }
}

function init(done) {

  function close(str) {
    term.fullscreen(false);
    done(str);
  }
  term.grabInput();

  term.on( 'key' , function( key) {
    switch ( key )
    {
      case 'UP' : up() ; break ;
      case 'DOWN' : down() ; break ;
      case 'u' : moveUp(); break;
      case 'd' : moveDown(); break;
      case 'p' : setCommand('pick'); break;
      case 'r' : setCommand('reword'); break;
      case 'e' : setCommand('edit'); break;
      case 's' : setCommand('squash'); break;
      case 'f' : setCommand('fixup'); break;
      case 'x' :
      case 'BACKSPACE' : cutLine(); break;
      case 'v' : pasteLine(); break;
      case 'q' : close(input.join('\n')) ; break ;
      case 'CTRL_C' : close('') ; break ;
      default:
      break ;
    }
    status('Pressed key:' + key + ' Current line: ' + lineNum);
  } ) ;



  term.on('terminal', function (key) {
    switch (key) {
      case 'SCREEN_RESIZE' : resetTerminal(); break;
      default: break;
    }
  });

}

module.exports =  {
  setData: setData,
  init: init

};
