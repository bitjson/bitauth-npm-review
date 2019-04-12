import chalk from 'chalk';
import * as execa from 'execa';

/**
 * Confirms that the 'git' command is available and that we're currently inside
 * a Git repository.
 *
 * Returns `true`, or an error message on failures.
 */
export const isInsideGitRepo = async () => {
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch (e) {
    return /not a git repository/.test(e.stderr)
      ? `BitAuth CLI uses Git. Please retry this command in a Git repository, or create a new one in this directory by running 'git init'.`
      : `BitAuth CLI uses Git. Please confirm that Git is installed and the 'git' command is available, then try again.`;
  }
};

/**
 * Confirms that the current working tree does not have uncommitted changes.
 *
 * Returns `true`, or an error message on failures.
 */
export const gitBranchIsClean = async () => {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain']);
    return stdout === ''
      ? true
      : `You have un-committed changes. Please commit or 'git stash' them to continue.`;
  } catch (e) {
    return `Git encountered an error. Please correct the issue and try again. Git error: ${
      e.stderr
    }`;
  }
};

/**
 * Try to create and switch to a new branch.
 *
 * Returns `true`, or an error message on failures.
 */
export const gitCheckoutNewBranch = async (branchName: string) => {
  try {
    await execa('git', ['checkout', '-b', branchName]);
    return true;
  } catch (e) {
    return `Git encountered an error. Please correct the issue and try again. Git error: ${
      e.stderr
    }`.trim();
  }
};

// pulling from artifacts branch:
// git checkout [branch] -- [artifact]
