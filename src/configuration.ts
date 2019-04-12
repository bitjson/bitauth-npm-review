import { pathExists, readFile, writeFile } from 'fs-extra';
import * as pkgDir from 'pkg-dir';
// TODO: use?
// import * as stringifyPretty from 'json-stringify-pretty-compact';
import * as sortKeys from 'sort-keys';
import { resolveProjectRoot } from './utils';

const currentConfigurationAPIVersion = 1;
const CONFIG = 'bitauth.config.json';
const EXCLUSIONS = 'bitauth.exclusions.json';

/**
 * To improve the signal-to-noise ratio in configuration changes, bitauth
 * configuration is spread across a few files in the bitauth directory. These
 * files are all optional, and if not present, defaults will be used (and saved
 * to their proper locations).
 */
export interface BitauthConfiguration {
  /**
   * The bulk of project configuration, stored in
   * `${BITAUTH_DIR}/bitauth.config.json`.
   */
  config: {
    /**
     * An array of module-review assignments, mapping
     */
    assignments: any;
    claims: any;
    /**
     * TODO: Patches are not yet implemented.
     */
    patches: any;
    /**
     * The current version number describing this configuration.
     *
     * This version number is strict – it is bumped when any changes occur to
     * the "public API" of bitauth's configuration. Newer clients should
     * automatically upgrade the configuration version, and older clients should
     * refuse to operate on projects with higher versions than they support.
     *
     * This prevents "churning" git changes in projects with many contributors.
     * If the configuration for a project is updated, everyone must update.
     */
    version: typeof currentConfigurationAPIVersion;
  };
  /**
   * Exclusions are precise versions of modules which have been explicitly
   * excluded from signing requirements.
   *
   * This is useful for projects migrating to bitauth; because the project has
   * already been implicitly trusting these versions of the specified modules,
   * it's reasonable to continue trusting them.
   *
   * Upon update, the differences between an excluded version and a new version
   * can be reviewed, and if approved, the new module is signed and removed from
   * the list of exclusions (thus including the module in validation).
   *
   * Exclusions are stored separately from the rest of the configuration at
   * `${BITAUTH_DIR}/bitauth.exclusions.json`.
   */
  exclusions: any;
}

const getConfigPaths = (bitauthDirectory: string) => ({
  configPath: `${bitauthDirectory}/${CONFIG}`,
  exclusionsPath: `${bitauthDirectory}/${EXCLUSIONS}`
});

/**
 * Rejects on write failure, resolves on success.
 *
 * Format and write the config file. If exclusions are present, format and write
 * the exclusions file as well.
 */
export const writeBitauthConfiguration = async (
  bitauthDirectory: string,
  configuration: BitauthConfiguration
) => {
  const { configPath, exclusionsPath } = getConfigPaths(bitauthDirectory);
  const prettyConfig = JSON.stringify(
    sortKeys(configuration.config),
    undefined,
    2
  );
  const prettyExclusions = JSON.stringify(
    sortKeys(configuration.exclusions),
    undefined,
    2
  );
  return Promise.all([
    writeFile(configPath, prettyConfig),
    prettyExclusions === '{}'
      ? Promise.resolve()
      : writeFile(exclusionsPath, prettyExclusions)
  ]);
};

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<RecursivePartial<U>>
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
};

/**
 * This method attempts to merge any found configuration into a valid standard
 * configuration. This sanitizes and/or adds known properties, but
 * unrecognized properties are left as-is.
 *
 * @param oldConfiguration a potentially-malformed configuration which does not
 * specify a version greater than `supportedConfigurationVersion`
 */
const createConfiguration = (
  oldConfiguration?: RecursivePartial<BitauthConfiguration>
): BitauthConfiguration => {
  return {
    config: {
      assignments: {},
      claims: {},
      patches: [],
      ...(oldConfiguration && oldConfiguration.config),
      version: currentConfigurationAPIVersion
    },
    exclusions: {
      ...(oldConfiguration && oldConfiguration.exclusions)
    }
  };
};

/**
 * Returns false if the file does not exist. Otherwise returns either a
 * filesystem/parsing error or the parsed result.
 * @param path
 */
const readJSONFile = async (
  path: string
): Promise<
  false | { success: true; parsed: unknown } | { success: false; error: string }
> => {
  const file = await pathExists(path);
  if (!file) {
    return false;
  }
  try {
    const configFile = await readFile(path, 'utf8');
    const parsed = JSON.parse(configFile);
    return {
      parsed,
      success: true
    };
  } catch (e) {
    return {
      error: `There was a problem reading from ${path}: ${e.toString()}`,
      success: false
    };
  }
};

/**
 * Create a clean BitauthConfiguration by reading the projects
 * (potentially-malformed) existing configuration files. Returns an error as a
 * string if there are filesystem errors or the configuration files are
 * malformed enough to bail.
 */
export const getBitauthConfiguration = async (
  bitauthDirectory: string
): Promise<BitauthConfiguration | string> => {
  const { configPath, exclusionsPath } = getConfigPaths(bitauthDirectory);
  const [configResult, exclusionsResult] = await Promise.all([
    readJSONFile(configPath).then(result => {
      if (!result) {
        return { success: true as true, config: {} };
      }
      if (result.success) {
        if (typeof result.parsed !== 'object' || result.parsed === null) {
          return {
            error: `This project's configuration (${CONFIG}) appears to be malformed. Please manually correct it (or remove it to generate a new one) and try again.`,
            success: false as false
          };
        }
        const config = result.parsed as Partial<BitauthConfiguration['config']>;
        if (Number(config.version) > 1) {
          return {
            error: `This project's configuration (${CONFIG}) appears to require a newer version of BitAuth CLI. Please run 'bitauth update' or review the configuration manually.`,
            success: false as false
          };
        }
        return { config, success: true as true };
      }
      return result;
    }),
    readJSONFile(exclusionsPath).then(result => {
      if (!result) {
        return { success: true as true, value: [] };
      }
      if (result.success) {
        if (typeof result.parsed !== 'object' || result.parsed === null) {
          return {
            error: `This project's ${EXCLUSIONS} appears to be malformed. Please manually correct it (or remove it to generate a new one) and try again.`,
            success: false as false
          };
        }
        return { success: true as true, exclusions: result.parsed };
      }
      return result;
    })
  ]);

  return configResult.success === false
    ? configResult.error
    : exclusionsResult.success === false
    ? exclusionsResult.error
    : createConfiguration({
        config: configResult.config,
        exclusions: exclusionsResult.exclusions
      });
};

export const getBitauthDirectory = (projectRoot: string) =>
  `${projectRoot}/.bitauth`;

/**
 * Apply a function to the project's `BitauthConfiguration`. This reads from an
 * existing configuration (upgrading to the latest version if necessary),
 * applies the `transform`, and writes changes back to the filesystem properly.
 *
 * Returns a string with an error message on failure.
 */
export const updateBitauthConfiguration = async (
  transform: (
    existingConfiguration: BitauthConfiguration
  ) => BitauthConfiguration
) => {
  const projectRoot = await resolveProjectRoot();
  if (projectRoot === null) {
    return `Could not locate a root for this project. Please re-run this command inside of a bitauth-enabled project.`;
  }
  const bitauthDirectory = getBitauthDirectory(projectRoot);
  const result = await getBitauthConfiguration(bitauthDirectory);
  if (typeof result === 'string') {
    return result;
  }
  const transformedConfiguration = transform(result);
  try {
    await writeBitauthConfiguration(bitauthDirectory, transformedConfiguration);
  } catch (e) {
    return `Configuration write failed: ${e.toString()}`;
  }
  return true;
};
