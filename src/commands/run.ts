import { Command, flags as Flag } from '@oclif/command';

export default class Run extends Command {
  public static readonly description = `run a package script safely
  
This command provides a convenient method for running the given package script inside Docker.

This is useful for projects which use native dependencies but don't yet have a way to ensure consistency across development environments.

Because artifacts are locked down, reviewed, and signed, if a project contributor is using a platform for development which is not supported by the signed native binaries (e.g. macOS or Windows), they may need to run those binaries in a Linux Container. Docker is a very performant option, and guarantees reproducibility across development environments.

Note, this should never be used in a Linux environment (e.g. production) – since Linux should already be supported by any native code in your reviewed artifacts.`;

  public static readonly examples = [
    `# run the "start" script using Docker
$ bitauth run start

# run the "serve" script
$ bitauth run serve
`
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [{ name: 'script', required: true }];

  public async run(): Promise<void> {
    const { args } = this.parse(Run);
    this.log(`TODO: add ${args.script}...`);
  }
}
