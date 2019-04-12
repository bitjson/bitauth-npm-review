import { Command, flags as Flag } from '@oclif/command';
import chalk from 'chalk';
import { existsSync, mkdirp, move, readFile, writeFile } from 'fs-extra';
import {
  getBitauthDirectory,
  updateBitauthConfiguration
} from '../configuration';
import { isInsideGitRepo } from '../git';
import { handleStringErrors, projectRootOrHandle } from '../utils';
import {
  getYarnLockfileObject,
  lockfileEntriesToExclusions,
  yarnInitialInstall
} from '../yarn';

export default class Init extends Command {
  public static readonly description = `prepare a project to use bitauth

This will start the interactive setup process. A .bitauth directory will be created at the project root containing initial configuration.

By default, the configuration will also be updated to exclude the currently-used versions of all installed modules. This is best for existing projects, since these modules have already been implicitly-trusted and allowed full access to installing machines. However, you can immediately enforce strict review by removing any or all exclusions.`;

  public static readonly examples = [
    `$ bitauth init
  `
  ];

  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  public static readonly args = [];

  public async run(): Promise<void> {
    this.log(
      chalk.dim(
        `This version of BitAuth CLI does not yet support isolation. For safety, postinstall scripts will be ignored. This may cause problems in packages with postinstall build or binary download steps (e.g. node-sass). To fix these issues, you can manually re-install those packages, but keep in mind that you may be giving untrusted code full access to your machine.`
      )
    );

    const PKG_DIR = await projectRootOrHandle(this.error);
    const BITAUTH_DIR = getBitauthDirectory(PKG_DIR);

    try {
      await mkdirp(BITAUTH_DIR);
      this.log(chalk.dim(`Created .bitauth directory.`));
    } catch (e) {
      this.error(`Couldn't create .bitauth directory: ${e}`);
    }

    // TODO: if a package-lock.json exists and no yarn.lock, start with 'yarn import'

    await handleStringErrors(isInsideGitRepo(), this.error);

    const NODE_MODULES_PATH = `${PKG_DIR}/node_modules`;
    const BACKUPS_DIR = `${BITAUTH_DIR}/backups`;
    const BACKUP_PATH = `${BACKUPS_DIR}/${new Date()
      .toISOString()
      .replace(/:/g, '')
      .replace('.', '_')}`;

    if (existsSync(NODE_MODULES_PATH)) {
      this.debug(`Moving existing node_modules to ${BACKUP_PATH}...`);
      try {
        await mkdirp(BACKUPS_DIR);
        await writeFile(`${BACKUPS_DIR}/.gitignore`, '*');
        await writeFile(
          `${BACKUPS_DIR}/readme.txt`,
          `Some projects have delicate or postinstall-modified node_module directories which can't be reproduced deterministically by Yarn.

The 'bitauth init' command moves any existing node_modules into this backup directory to help those projects debug issues.

If your project is still working after 'bitauth init', you can safely delete this directory.`
        );
        await move(NODE_MODULES_PATH, `${BACKUP_PATH}/node_modules`);
      } catch (e) {
        this.error(
          `There was a problem moving your existing node_modules: ${e}`
        );
      }
    }

    this.debug(`Installing with Yarn...`);
    await handleStringErrors(yarnInitialInstall(), this.error);

    const exclusions = lockfileEntriesToExclusions(
      Object.entries(
        await handleStringErrors(getYarnLockfileObject(PKG_DIR), this.error)
      )
    );

    this.log(
      `Initialized bitauth with ${Object.keys(exclusions).length} exclusions.`
    );
    const result = await updateBitauthConfiguration(configuration => {
      // tslint:disable-next-line: no-object-mutation
      configuration.exclusions = exclusions;
      return configuration;
    });

    if (typeof result === 'string') {
      this.error(result);
    }

    this.log(`
${chalk.inverse(` You're ready to use BitAuth CLI 🚀 `)}

${chalk.bold(`To add a dependency:`)}
${chalk.dim(`$ bitauth add [package-name]`)}

${chalk.bold(`To upgrade a dependency:`)}
${chalk.dim(`$ bitauth upgrade`)}

${chalk.bold(`To review existing dependencies:`)}
${chalk.dim(`$ bitauth review`)}

${chalk.bold(`For more information:`)}
${chalk.dim(`$ bitauth help`)}
`);
  }
}
