import { Command, flags as Flag } from '@oclif/command';

export default class Install extends Command {
  public static readonly description = `install all approved artifacts
  
The \`install\` command verifies signatures and installs all required, approved artifacts. It's the safer alternative to npm/yarn/pnpm \`install\`.

Only packages which meet your project's code-signing requirements will be installed. If an approved artifact for a required package is not available, the \`install\` command will error without modifying your working directory.`;

  public static readonly examples = [
    `# safely install all dependencies
$ bitauth install`
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [];

  public async run(): Promise<void> {
    this.log(`TODO: install`);
  }
}
