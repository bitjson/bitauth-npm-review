import { Command, flags as Flag } from '@oclif/command';

export default class Config extends Command {
  public static readonly description = `view and update bitauth configuration

View and update both user-level and project-level bitauth configuration. The command is interactive, and detailed help information is provided in context.`;

  public static readonly examples = [
    `$ bitauth config
  `
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [];

  public async run(): Promise<void> {
    this.log(`TODO: config`);
  }
}
