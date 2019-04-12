import { Command, flags as Flag } from '@oclif/command';
import chalk from 'chalk';
import cli from 'cli-ux';
import * as execa from 'execa';
import {
  createReadStream,
  mkdirp,
  move,
  readdir,
  remove,
  writeFile
} from 'fs-extra';
import { fromStream } from 'ssri';
import { extract } from 'tar-fs';
import { createGunzip } from 'zlib';
import { getBitauthDirectory } from '../configuration';
// import { prompt } from 'inquirer';
import {
  gitBranchIsClean,
  gitCheckoutNewBranch,
  isInsideGitRepo
} from '../git';
import {
  handleStringErrors,
  projectRootOrHandle,
  resolveBitauthRoot
} from '../utils';
import {
  getPackageIdentifier,
  getYarnLockfileObject,
  noIntegrityHashError,
  yarnFetchPackageArchive
} from '../yarn';

const BITAUTH_REVIEWS_GIT_BRANCH_PREFIX = `bitauth/reviews/`;

export default class Review extends Command {
  public static readonly description = `start a review
  
This command starts the interactive review process. The interactive interface lets you select a package to review from among a list of your unreviewed packages. You can also skip this step by specifying a package directly.`;

  public static readonly examples = [
    `$ bitauth review
$ bitauth review @bitauth/core
`
  ];

  // TODO: --no-prettier
  public static readonly flags = {
    help: Flag.help({ char: 'h' })
  };

  // TODO: autocomplete package-id argument
  public static readonly args = [{ name: 'package-id' }];

  public async run(): Promise<void> {
    const { args } = this.parse(Review);
    const identifier: string | undefined = args['package-id'];

    const PKG_DIR = await projectRootOrHandle(this.error);
    const lockfile = await handleStringErrors(
      getYarnLockfileObject(PKG_DIR),
      this.error
    );

    const availableIdentifiers = Object.entries(lockfile)
      .map(entry => getPackageIdentifier(entry[0], entry[1].version))
      .filter((id, i, array) => array.indexOf(id) === i)
      .sort();

    const logStatus = () => {
      this.log(
        `\n${
          // TODO: pull in active ID
          chalk.bold.inverse(' Unreviewed Packages – Identity: My Name ')
        }\n\n${availableIdentifiers.join('\n')}\n`
      );
    };

    if (!identifier) {
      logStatus();
      return this.error(
        `Sorry, this version of BitAuth CLI does not yet support the interactive review command. Please specify a package to review.
Try 'bitauth review --help' for more information.`
      );
    }

    if (availableIdentifiers.indexOf(identifier) === -1) {
      logStatus();
      this.error(
        `The provided package identifier (${identifier}) is not used in this project.
Try 'bitauth review --help' for more information.`
        // TODO: interactive mode (no argument provided)
        // run verify:
        // - update all necessary authhead information
        // - (storing the full chain locally, so we can alert if the server sends a conflicting chain in the future:
        // - - "The server at https://api.bitauth.com/ returned a conflicting authchain for identity 'Name'. Please verify that this re-org is not malicious by confirming the following using another trusted node or block explorer: authbase [TXID] resolves to authhead [TXID] as of [ISO DATE].
        // - step through assignments check all signatures
        // - output "project status summary" – number of excluded modules (never reviewed), number of reviewed modules
      );
    }

    const packageName = identifier.slice(0, identifier.lastIndexOf('@'));
    const packageVersion = identifier.slice(identifier.lastIndexOf('@') + 1);
    const reviewBranch = `${BITAUTH_REVIEWS_GIT_BRANCH_PREFIX}${packageName}/${packageVersion}`;
    await handleStringErrors(isInsideGitRepo(), this.error);
    await handleStringErrors(gitBranchIsClean(), this.error);
    await handleStringErrors(gitCheckoutNewBranch(reviewBranch), this.error);

    const BITAUTH_DIR = getBitauthDirectory(PKG_DIR);
    const ARCHIVE_DIR = `${BITAUTH_DIR}/archives`;
    const REVIEW_DIR = `${BITAUTH_DIR}/review`;

    try {
      await mkdirp(ARCHIVE_DIR);
      await writeFile(`${ARCHIVE_DIR}/.gitignore`, '*');
    } catch (e) {
      this.error(e);
    }

    const resolutionMap = Object.entries(lockfile).reduce<{
      [identifier: string]: { resolved: string; integrity?: string };
    }>(
      (all, entry) => ({
        ...all,
        [getPackageIdentifier(entry[0], entry[1].version)]: {
          integrity: entry[1].integrity,
          resolved: entry[1].resolved
        }
      }),
      {}
    );

    // TODO: extract previous version and commit first

    const item = resolutionMap[identifier];
    const integrity = item.integrity;
    if (integrity === undefined) {
      return this.error(noIntegrityHashError);
    }

    const uri = item.resolved;
    await handleStringErrors(
      yarnFetchPackageArchive(uri, ARCHIVE_DIR),
      this.error
    );
    const archivePath = `${ARCHIVE_DIR}/${
      (uri.split('/').pop() as string).split('#')[0]
    }`;
    const [algorithm, expectedDigest] = integrity.split('-');
    cli.action.start('Verifying archive integrity');
    const archiveDigest = (await fromStream(createReadStream(archivePath), {
      algorithms: [algorithm]
    }))[algorithm][0].digest;
    if (expectedDigest !== archiveDigest) {
      cli.action.stop('error');
      this.error(
        `${chalk.bold.bgRed.white(' ⚠️  Archive integrity check failed. ')}
Expected digest: ${expectedDigest}
Archive digest:  ${archiveDigest}
Archive path:    ${archivePath}
Resolved:        ${uri}

There is a discrepancy between the digest in yarn.lock and the digest of the resolved archive. It may be wise to inspect this file in a isolated environment.`
      );
    }
    cli.action.stop('success');

    cli.action.start('Extracting archive');
    const reviewDirectory = `${REVIEW_DIR}/${packageName}`;
    const temporaryDirectory = `${archivePath}-extracted`;
    try {
      await new Promise((resolve, reject) => {
        const stream = createReadStream(archivePath)
          .pipe(createGunzip())
          .pipe(extract(temporaryDirectory));
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
      await move(`${temporaryDirectory}/package`, reviewDirectory);
      const unexpectedFiles = await readdir(temporaryDirectory);
      if (unexpectedFiles.length !== 0) {
        this.error(`The archive includes one or more unexpected files:
${unexpectedFiles.join('\n')}

Please report this issue: https://github.com/bitauth/bitauth-cli/issues
Archive digest:  ${archiveDigest}
Archive path:    ${archivePath}
Resolved:        ${uri}
`);
      }
      await remove(temporaryDirectory);
      await remove(archivePath);
    } catch (e) {
      this.error(e);
    }
    cli.action.stop('done');

    cli.action.start('Deterministically formatting code with Prettier');
    try {
      await writeFile(
        `${REVIEW_DIR}/.gitignore`,
        `.gitignore\n.prettier.config.js`
      );
      /**
       * We write this as a file to ensure that the user's editor won't try to
       * modify formatting if they have a Prettier plugin installed.
       */
      await writeFile(
        `${REVIEW_DIR}/.prettier.config.js`,
        `/**
* Our goal with these settings is to minimize syntax noise during reviews.
*/
module.exports = {
  arrowParens: 'always',
  singleQuote: true,
  trailingComma: 'es5'
};
`
      );
      await execa(
        `${await resolveBitauthRoot()}/node_modules/.bin/prettier`,
        ['--write', '**/*'],
        {
          cwd: reviewDirectory
        }
      );
    } catch (e) {
      this.debug(`Prettier encountered an error: ${e.stderr}`);
    }
    cli.action.stop('done');

    // TODO: git commit

    // TODO: other helpful info?
    // repo link, homepage link, versions released between previous version and version under review?
    this.log(`
${chalk.inverse(` 🔎  Review Started: ${identifier} `)}

A new Git branch (${chalk.blue(
      reviewBranch
    )}) has been created for this review. This branch reflects the changes made since the previous version of this package(${chalk.dim(
      'TODO: version'
    )}).

${chalk.bold(`Finish reviewing and sign:`)}
${chalk.dim(`$ bitauth approve`)}

${chalk.bold(`Cancel the review and delete this review branch:`)}
${chalk.dim(`$ bitauth reject`)}
`);
  }
}
