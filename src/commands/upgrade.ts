import { Command, flags as Flag } from '@oclif/command';

export default class Upgrade extends Command {
  public static readonly description = `start the interactive upgrade process
  
\`upgrade\` lists all dependencies for which a newer version is available. You can choose a dependency from the list to update, and the update will be installed inside a sandbox (using Docker). You'll also have the option to immediately start a review for the newly created artifact.`;

  public static readonly examples = [
    `$ bitauth upgrade
  `
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [];

  public async run(): Promise<void> {
    this.log(`TODO: upgrade`);
  }
}
