import * as pkgDir from 'pkg-dir';

/**
 * Run an `action` which returns strings on failure, and only return successful
 * results.
 *
 * If `action` fails, run a process-aborting `handler` (e.g. `this.error`).
 */
export const handleStringErrors = async <T>(
  action: Promise<T | string>,
  handler: (error: string) => never
) => {
  const result = await action;
  if (typeof result === 'string') {
    return handler(result);
  }
  return result;
};

/**
 * Get the project root, or pass an error to `handler`.
 */
export const projectRootOrHandle = async (
  handler: (error: string) => never
) => {
  const packageRoot = await resolveProjectRoot();
  if (packageRoot === null) {
    return handler(
      `Couldn't find a project root. To get started, run 'bitauth init' inside a project with a package.json file.`
    );
  }
  return packageRoot;
};

export const resolveProjectRoot = () => pkgDir(process.cwd());
export const resolveBitauthRoot = () => pkgDir(__dirname);
