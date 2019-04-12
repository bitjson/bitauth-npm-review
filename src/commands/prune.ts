import { Command, flags as Flag } from '@oclif/command';

export default class Prune extends Command {
  public static readonly description = `start the repo-pruning assistant

This command is an interactive assistant which helps to reduce your Git repository size by migrating to new \`artifacts\` and \`deploy\` branches. With the old branches not in use, they can be safely deleted.

This process is designed to avoid overwriting history. This makes it much easier to thin down a repo – even with a large, distributed set of contributors. As contributors check out the updated configuration, they will automatically begin using the new, lighter-weight branch. They can then delete or archive the branches containing old, unused artifacts.`;

  public static readonly examples = [
    `$ bitauth prune
  `
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [];

  public async run(): Promise<void> {
    this.log(`TODO: prune`);
  }
}
