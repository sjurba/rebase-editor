'use strict';


const renderer = require('./lib/terminal_renderer');
const reduce = require('./lib/reducer');

let state = {
    lines: ['Hello', 'World'],
    cursor: {
        pos: 0
    }
};

function close() {
    renderer.close();
    process.exit(0);
}

renderer.init((key) => {
    if (key === 'quit' || key === 'abort') {
        close();
    } else {
        state = reduce(state, key);

        renderer.render(state);
    }
});

renderer.render(state);
