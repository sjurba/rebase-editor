import { expect } from 'chai';
import sinon from 'sinon';
import childProcess from 'child_process';
import { getFullCommitMessages } from '../src/git-commands';

describe('git-commands', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('should return trimmed commit message for a single hash', async function () {
    sinon.stub(childProcess, 'execFile').callsFake((_cmd: string, args: unknown, cb: unknown) => {
      expect(args).to.include('abc123def456');
      (cb as (err: null, stdout: string) => void)(null, 'My commit message\n\nSecond paragraph\n\x1e');
      return {} as ReturnType<typeof childProcess.execFile>;
    });
    const msg = await getFullCommitMessages(['abc123def456']);
    expect(msg).to.equal('My commit message\n\nSecond paragraph');
  });

  it('should normalize Windows-style CRLF in git output', async function () {
    sinon.stub(childProcess, 'execFile').callsFake((_cmd: string, _args: unknown, cb: unknown) => {
      (cb as (err: null, stdout: string) => void)(null, 'My commit message\r\n\r\nSecond paragraph\r\n\x1e');
      return {} as ReturnType<typeof childProcess.execFile>;
    });
    const msg = await getFullCommitMessages(['abc123def456']);
    expect(msg).to.equal('My commit message\n\nSecond paragraph');
  });

  it('should join messages for multiple hashes in order', async function () {
    sinon.stub(childProcess, 'execFile').callsFake((_cmd: string, args: unknown, cb: unknown) => {
      const argArr = args as string[];
      expect(argArr).to.include('aaaa1111');
      expect(argArr).to.include('bbbb2222');
      expect(argArr).to.include('cccc3333');
      (cb as (err: null, stdout: string) => void)(null, 'Message C\x1eMessage B\x1eMessage A\x1e');
      return {} as ReturnType<typeof childProcess.execFile>;
    });
    const msg = await getFullCommitMessages(['aaaa1111', 'bbbb2222', 'cccc3333']);
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
    sinon.stub(childProcess, 'execFile').callsFake((_cmd: string, _args: unknown, cb: unknown) => {
      (cb as (err: null, stdout: string) => void)(null, 'D\x1eC\x1eB\x1eA\x1e');
      return {} as ReturnType<typeof childProcess.execFile>;
    });
    const msg = await getFullCommitMessages(['aaaa1111', 'bbbb2222', 'cccc3333', 'dddd4444']);
    expect(msg).to.include('# This is the 4th commit message:');
  });

  it('should reject if exec call fails', async function () {
    const error = new Error('git not found');
    sinon.stub(childProcess, 'execFile').callsFake((_cmd: string, _args: unknown, cb: unknown) => {
      (cb as (err: Error) => void)(error);
      return {} as ReturnType<typeof childProcess.execFile>;
    });
    try {
      await getFullCommitMessages(['abc123def456']);
      throw new Error('Should have rejected');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });

  it('should reject on invalid commit hash', async function () {
    try {
      await getFullCommitMessages(['not_a_hash!']);
      throw new Error('Should have rejected');
    } catch (err) {
      expect((err as Error).message).to.equal('Invalid commit hash.');
    }
  });

});
