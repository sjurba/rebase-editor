'use strict';
const bindings = require('../lib/key-bindings')(),
  reducer = require('../lib/reducer'),
  getState = require('./state-gen');

function getActions() {
  const actions = Object.keys(bindings).reduce((set, key) => {
    set.add(bindings[key]);
    return set;
  }, new Set());
  actions.add('unknown');
  return [...actions];
}

describe('Fuzzy reducer test', function () {
  it('should not fail', function () {
    const executedActions = [];
    try {
      const actions = getActions();
      let state = getState(15, 3, 10);
      for (let i = 0; i < 100; i++) {
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        executedActions.push(randomAction);
        state = reducer(state, randomAction);
      }
    } catch (err) {
      console.log('Executed actions', executedActions);
      throw err;
    }
  });
});
