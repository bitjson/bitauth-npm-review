import * as lockfile from '@yarnpkg/lockfile';
import cli from 'cli-ux';
import * as execa from 'execa';
import { readFile } from 'fs-extra';
import { resolveBitauthRoot } from './utils';

export interface YarnLockfileObject {
  /**
   * @param unresolvedIdentifier The string used in the project's `package.json`
   * to refer to this package, e.g. `@bitauth/core@^1`.
   */
  [unresolvedIdentifier: string]: {
    /**
     * The version as specified in the dependency's `package.json`.
     *
     * E.g. `1.2.3-beta.4`
     */
    version: string;
    /**
     * The URI from which the dependency was downloaded.
     *
     * E.g. `https://registry.yarnpkg.com/bitcoin-ts/-/bitcoin-ts-1.4.0.tgz#64bfaac0d06e4640bee68ac94ba659f0d751691e`.
     */
    resolved: string;
    /**
     * The integrity hash of the dependency archive. Only included for
     * dependencies which resolve to a registry.
     *
     * E.g. `sha512-usbCWg0V26wqdyHT7//DMIckBDf2w8WMVkiDREwpWb2x6EjlhWhSN24JNssvpN8vlhCoFF9a1+X8F/gr9h3f4g==`
     */
    integrity?: string;
    /**
     * A map of the strings used in the dependency's `package.json` to identify
     * the acceptable versions of it's sub-dependencies.
     *
     * E.g. `@bitauth/core@^1`.
     */
    dependencies?: {
      /**
       *  @param name The `name` of the sub-dependency as specified in it's
       * `package.json`.
       */
      [name: string]: string;
    };
  };
}

/**
 * Returns an error message on failure.
 *
 * @param packageDirectory the root directory of the current package
 */
export const getYarnLockfileObject = async (packageDirectory: string) => {
  try {
    const yarnLockContents = await readFile(
      `${packageDirectory}/yarn.lock`,
      'utf8'
    );
    const yarnLockParsed = lockfile.parse(yarnLockContents);
    if (
      yarnLockParsed.type !== 'success' ||
      typeof yarnLockParsed.object !== 'object'
    ) {
      return `Unable to parse yarn.lock. Try running 'yarn' to repair it.`;
    }
    return yarnLockParsed.object as YarnLockfileObject;
  } catch (e) {
    return `Failed to parse yarn.lock: ${e.toString()}`;
  }
};

/**
 * Return the `package-name@version` formatted identifier for a specific package.
 *
 * @param unresolvedIdentifier The exact identifier used to reference the dependency in a `package.json`.
 * @param version The `version` of the dependency as specified in it's own `package.json`.
 */
export const getPackageIdentifier = (
  unresolvedIdentifier: string,
  version: string
) =>
  `${unresolvedIdentifier.slice(
    0,
    unresolvedIdentifier.lastIndexOf('@')
  )}@${version}`;

export const noIntegrityHashError =
  'Yarn does not provide an integrity hash for this dependency. Consider packaging and re-adding it.';

/**
 * Reduce a whole or partial `YarnLockfileObject` to a map of exclusions.
 *
 * @param entries The result of `Object.entries` over any segment of a `YarnLockfileObject`.
 */
export const lockfileEntriesToExclusions = (
  entries: Array<[string, YarnLockfileObject['unresolvedIdentifier']]>
) => {
  return entries.reduce<{ [packageIdentifier: string]: string }>(
    (all, entry) => ({
      ...all,
      [getPackageIdentifier(entry[0], entry[1].version)]:
        entry[1].integrity || noIntegrityHashError
    }),
    {}
  );
};

/**
 * Run the initial Yarn installation using the bundled version of Yarn.
 *
 * Returns `true`, or an error message on failures.
 *
 * **Implementation note** — We don't use `--pure-lockfile` here because:
 * - the user hasn't run `yarn`, they won't have a `yarn.lock`.
 * - If the project has a `yarn.lock`, but it's currently out of sync with
 *   `package.json`, the project is probably not strictly reviewing it's
 *   dependencies (and may not even be committing the `yarn.lock`).
 *   - If that's true, it's notably better experience to start out with
 *     newer transitive dependencies (for little security loss).
 *
 * TODO: wrap in Docker isolation, don't ignore scripts, detect, create, and
 * sign initial patches (not a full review), add patches to config
 */
export const yarnInitialInstall = async () => {
  try {
    // TODO: use bundled yarn
    await execa(
      `${await resolveBitauthRoot()}/node_modules/.bin/yarn`,
      ['--ignore-scripts'],
      {
        stdio: 'inherit'
      }
    );
    return true;
  } catch (e) {
    return `Install failed: ${e}`;
  }
};

/**
 * Fetch a package archive from `resolvedUri`, saving it to `destinationPath`.
 *
 * Returns `true`, or an error message on failures.
 *
 * **Implementation note** – This uses `npm` until this issue is solved:
 * https://github.com/yarnpkg/yarn/issues/7101
 *
 * @param resolvedUri The `resolved` URI specified for the package in `yarn.lock`.
 * @param destinationDirectory the directory to which the archive should be saved.
 */
export const yarnFetchPackageArchive = async (
  resolvedUri: string,
  destinationDirectory: string
) => {
  try {
    cli.action.start('Fetching archive');
    await execa('npm', ['pack', resolvedUri], { cwd: destinationDirectory });
    cli.action.stop('done');
    return true;
  } catch (e) {
    return `Archive fetch failed: ${e.stderr}`;
  }
};
