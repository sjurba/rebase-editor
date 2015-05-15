#!/usr/bin/env node
var fs = require('fs'),
    tty = require("tty");

var term = require( 'terminal-kit' ).terminal;

var file = process.argv[process.argv.length-1];

var editorCommands = [
  "# Rebase editor specific commands",
  "u = up, move line up",
  "d = down, move line down",
  "x = cut, cut line",
  "v = paste, paste line",
  "q = save and quit",
  "Ctrl-c = abort"
];

term.fullscreen(true);

term.grabInput( { mouse: 'button' } ) ;

var input = [];
var deletedInput = [];
var lineNum = 0;
var lastLine;

function close(save) {
  var buffer = term.str();
  term.fullscreen(false);
  var output = save ? input.join('\n') : '';
  writeToFile(output, function(){
    process.exit();
  });
}

function moveLine(dir) {
  var line = input[lineNum];
  input[lineNum] = input[lineNum+dir];
  input[lineNum+dir] = line;
  replaceLine();
  move(dir);
  replaceLine();
}

function replaceLine() {
  term.eraseLine();
  term(input[lineNum]);
  term.column(0);
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

function move(lines) {
  term.move(0, lines);
  lineNum += lines;
  status('Line number: ' + lineNum);
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

function status(stat) {
  term.saveCursor() ;
  term.moveTo.bgWhite.black( 1 , 1 ).eraseLine() ;
  term(stat) ;
  term.white.bgBlack() ;
  term.restoreCursor() ;
}


term.on( 'key' , function( key , matches , data ) {

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
    case 'q' : close(true) ; break ;
    case 'CTRL_C' : close(false) ; break ;
    default:
    // Echo anything else
    // term.noFormat(
    //   Buffer.isBuffer( data.code ) ?
    //   data.code :
    //   String.fromCharCode( data.code )
    // ) ;
    break ;
  }
} ) ;

term.on('terminal', function (key, data) {
  switch (key) {
    case 'SCREEN_RESIZE' : resetTerminal(); break;
    default: break;
  }
});

function resetTerminal() {
  term.saveCursor();
  term.moveTo(1,2);
  term.eraseDisplayBelow();
  var data = input.join('\n');
  data = data.replace(/#\s*x, exec.*/, editorCommands.join('\n#  '));
  data = data.split('\n').slice(0, term.height - 1).join('\n');
  status('Status');
  term(data);
  term.restoreCursor();
}

term.on( 'mouse' , function( name , data ) {
  term.moveTo( data.x , data.y ) ;
} ) ;

term('\n');
status("Status " + file);

fs.readFile(file, 'utf8', function (err,data) {
  if (err) {
    return status(err);
  }
  if (data !== null) {
    input = input.concat(data.split('\n'));
    resetTerminal();
  }
  term.moveTo(1,2);
  for (var i = 0; i< input.length; i++) {
    if (input[i] === '') {
      lastLine = i-1;
      break;
    }
  }
  status('Last line: ' + lastLine);
});

function writeToFile(str, cb) {
  fs.writeFile(file, str, function(err) {
    if(err) {
      console.log(err);
      cb();
    }

    console.log("The file was saved!");
    cb();
  });
}
