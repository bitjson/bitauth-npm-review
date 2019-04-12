import { Command, flags as Flag } from '@oclif/command';

export default class Add extends Command {
  public static readonly description = `add a new dependency to the project
  
This command is the best way to introduce new dependencies in a project. It's the safer alternative to "npm install".`;

  public static readonly examples = [
    `$ bitauth add @bitauth/core
`
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [{ name: 'package-name', required: true }];

  public async run(): Promise<void> {
    const { args } = this.parse(Add);
    this.log(`TODO: add ${args['package-name']}...`);
  }
}
