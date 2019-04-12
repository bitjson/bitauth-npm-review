import { Command, flags as Flag } from '@oclif/command';

export default class Exec extends Command {
  public static readonly description = `execute a shell command safely
  
This command provides a convenient method for running the given shell command inside Docker. It's like \`npx\`, \`yarn exec\`, or \`pnpx\` in that it supports commands provided by installed dependencies. See the help information for the \`run\` command for details.`;

  public static readonly examples = [
    `# TODO: examples
$ bitauth exec lscpu`
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  // public static readonly args = [{ name: 'script', required: true }];

  public async run(): Promise<void> {
    // const { args } = this.parse(Exec);
    this.log(`TODO: exec`);
  }
}
