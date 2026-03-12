import { expect } from 'chai';
import sinon from 'sinon';
import childProcess from 'child_process';
import { getFullCommitMessage } from '../src/git-commands';

describe('git-commands', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('should return trimmed commit message', async function () {
    sinon.stub(childProcess, 'exec').callsFake((_cmd: string, cb: unknown) => {
      (cb as (err: null, stdout: string) => void)(null, 'My commit message\n\nSecond paragraph\n');
      return {} as ReturnType<typeof childProcess.exec>;
    });
    const msg = await getFullCommitMessage('abc123');
    expect(msg).to.equal('My commit message\n\nSecond paragraph');
    expect((childProcess.exec as sinon.SinonStub).firstCall.args[0]).to.include('abc123');
  });

  it('should reject on exec error', async function () {
    const error = new Error('git not found');
    sinon.stub(childProcess, 'exec').callsFake((_cmd: string, cb: unknown) => {
      (cb as (err: Error) => void)(error);
      return {} as ReturnType<typeof childProcess.exec>;
    });
    try {
      await getFullCommitMessage('abc123');
      throw new Error('Should have rejected');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });

});
