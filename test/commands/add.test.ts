import { expect, test } from '@oclif/test';

describe('add', () => {
  test
    .stdout()
    .command(['add'])
    .it('runs add', ctx => {
      expect(ctx.stdout).to.contain('add world');
    });
});
