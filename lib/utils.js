'use strict';

export function trimTo(line, length) {
  let sofar = 0;
  let tag = false;
  return line.split('').map((c) => {
    if (sofar >= length) {
      return;
    }
    if (c === '^') {
      if (tag) {
        tag = false;
        sofar++;
      } else {
        tag = true;
      }
    } else if (c === ' ' && tag) {
      tag = false;
      sofar++;
    } else if (tag) {
      tag = false;
    } else {
      sofar++;
    }
    return c;

  }).filter((c) => c).join('');
}

export default { trimTo };
