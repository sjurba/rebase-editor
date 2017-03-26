'use strict';
module.exports = function debounce(func, wait) {
  let timeout, args, timestamp;

  function later() {
    const last = Date.now() - timestamp;
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      func(...args);
      timeout = args = null;
    }
  };

  return function debounced(...funcArgs) {
    args = funcArgs;
    timestamp = Date.now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
    }
  };
};
