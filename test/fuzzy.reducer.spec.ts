import bindingsFactory from '../src/key-bindings';
import reducer from '../src/reducer';
import getState from './state-gen';
import { expect } from 'chai';
import { RebaseState } from '../src/types';

const bindings = await bindingsFactory();

function getActions(): string[] {
  const actions = Object.keys(bindings).reduce((set, key) => {
    set.add(bindings[key]);
    return set;
  }, new Set<string>());
  actions.add('unknown');
  return [...actions];
}

describe('Fuzzy reducer test', function () {
  it('should not fail', function () {
    const executedActions: string[] = [];
    try {
      const actions = getActions();
      let state: RebaseState | Readonly<RebaseState> = getState(15, 3, 10);
      for (let i = 0; i < 100; i++) {
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        executedActions.push(randomAction);
        state = reducer(state as RebaseState, randomAction);
      }
    } catch (err) {
      console.log('Executed actions', executedActions);
      throw err;
    }
  });
});
