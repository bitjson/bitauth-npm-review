import { Command, flags as Flag } from '@oclif/command';

export default class Deploy extends Command {
  public static readonly description = `create a new deployment commit

This command is not an essential part of the BitAuth CLI workflow. It is a convenience method primarily for use by projects which are deployed using Platform as a Service (PaaS) services. Because these services often operate on a single Git branch, all requisite code must be present on the branch used for deployment.

This copies the state of the currently active Git branch into a new commit in the deployment branch managed by bitauth (by default, \`bitauth deploy\`). It also commits all in-use artifacts to \`.bitauth/artifacts/\`. When \`bitauth install\` runs, it will pull artifacts from this location, rather than the configured artifacts branch.`;

  public static readonly examples = [
    `# automatically update the deployment branch
$ bitauth deploy`
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [];

  public async run(): Promise<void> {
    this.log(`TODO: deploy`);
  }
}
