import { expect } from 'chai';
import sinon from 'sinon';
import childProcess from 'child_process';
import { getFullCommitMessages } from '../src/git-commands';

describe('git-commands', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('should return trimmed commit message for a single hash', async function () {
    sinon.stub(childProcess, 'exec').callsFake((cmd: string, cb: unknown) => {
      expect(cmd).to.include('abc123');
      (cb as (err: null, stdout: string) => void)(null, 'My commit message\n\nSecond paragraph\n\x1e');
      return {} as ReturnType<typeof childProcess.exec>;
    });
    const msg = await getFullCommitMessages(['abc123']);
    expect(msg).to.equal('My commit message\n\nSecond paragraph');
  });

  it('should normalize Windows-style CRLF in git output', async function () {
    sinon.stub(childProcess, 'exec').callsFake((_cmd: string, cb: unknown) => {
      (cb as (err: null, stdout: string) => void)(null, 'My commit message\r\n\r\nSecond paragraph\r\n\x1e');
      return {} as ReturnType<typeof childProcess.exec>;
    });
    const msg = await getFullCommitMessages(['abc123']);
    expect(msg).to.equal('My commit message\n\nSecond paragraph');
  });

  it('should join messages for multiple hashes in order', async function () {
    sinon.stub(childProcess, 'exec').callsFake((cmd: string, cb: unknown) => {
      expect(cmd).to.include('sha_c sha_b sha_a');
      (cb as (err: null, stdout: string) => void)(null, 'Message C\x1eMessage B\x1eMessage A\x1e');
      return {} as ReturnType<typeof childProcess.exec>;
    });
    const msg = await getFullCommitMessages(['sha_c', 'sha_b', 'sha_a']);
    expect(msg).to.include('# This is a combination of 3 commits');
    expect(msg).to.include('# This is the 1st commit message:');
    expect(msg).to.include('Message A');
    expect(msg).to.include('# This is the 2nd commit message:');
    expect(msg).to.include('Message B');
    expect(msg).to.include('# This is the 3rd commit message:');
    expect(msg).to.include('Message C');
    expect(msg).to.include('# Please enter the commit message for your changes.');
  });

  it('should use nth ordinal for 4+ commits', async function () {
    sinon.stub(childProcess, 'exec').callsFake((_cmd: string, cb: unknown) => {
      (cb as (err: null, stdout: string) => void)(null, 'D\x1eC\x1eB\x1eA\x1e');
      return {} as ReturnType<typeof childProcess.exec>;
    });
    const msg = await getFullCommitMessages(['sha_d', 'sha_c', 'sha_b', 'sha_a']);
    expect(msg).to.include('# This is the 4th commit message:');
  });

  it('should reject if exec call fails', async function () {
    const error = new Error('git not found');
    sinon.stub(childProcess, 'exec').callsFake((_cmd: string, cb: unknown) => {
      (cb as (err: Error) => void)(error);
      return {} as ReturnType<typeof childProcess.exec>;
    });
    try {
      await getFullCommitMessages(['abc123']);
      throw new Error('Should have rejected');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });

});
