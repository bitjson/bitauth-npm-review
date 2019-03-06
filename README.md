# @bitauth/cli

Reliable security reviews for Node.js dependencies.

BitAuth CLI includes development tooling to:

- safely install and review untrusted dependencies
- sign and store the reviewed dependencies
- install directly from the stored dependencies (for production use)

## Getting Started

With [Node.js](https://nodejs.org/en/download/) v10 LTS or later, install the CLI globally:

```sh
npm i -g @bitauth/cli
```

It's important to install BitAuth CLI globally (`-g`), because you'll be using it to authenticate local dependencies. If installed locally, a malicious dependency could hide itself from BitAuth CLI.

For development, you'll also need to [install Docker](https://docs.docker.com/install/). Docker is used both to sandbox dependencies during review and to install the proper versions of some native dependencies. When using `bitauth` in a production environment, Docker is not necessary.

By default, your BitAuth configuration and code-signing keys are stored at `~/.bitauth`. This can be configured using the `$BITAUTH_CONFIG_PATH` environment variable.

### `bitauth init`

To begin locking down your project's dependencies, switch to the root directory of your project and run:

```sh
# cd my-project/
bitauth init
```

This will start the interactive setup process.

BitAuth CLI creates and operates within a `.bitauth` directory at the root of your project. This directory contains project configuration, signing identity information, and signatures. It's also used during the review process.

# Usage

BitAuth CLI includes commands to safely install new dependencies, update existing dependencies, interactively review dependencies, verify code signatures of existing dependencies, and more.

A summary of each command is provided below. You can also type `bitauth --help`

## `bitauth install [package-name]`

This is the BitAuth CLI equivalent of `npm install`. It can be used without any other arguments to install all packages in the `package.json` file:

```
bitauth install
```

Or it can be used to specify a new package to install which is not already in the `package.json` file:

```
bitauth install @bitauth/core
```

The `install` command always tries to install from exact versions of dependencies (artifacts) you've previously approved.

If an approved artifact is not available, the package will be installed using your package manager (e.g. `npm install`). By default, new packages are installed within a sandbox created using Docker – this prevents potentially-malicious package scripts from having full access to your machine.

If Docker is not available (or BitAuth CLI is configure for production) and a trusted artifact cannot be found, the `install` command will simply fail.

## `bitauth review`

The `review` command starts the interactive review process. The interactive interface lets you select a package to review from among a list of your unreviewed packages. You can also skip this step by specifying a package directly: `bitauth review [package-name]`.

When you've chosen a package to review, it will be placed at `.bitauth/reviews/ARTIFACT_ID` in a new `bitauth/review` Git branch. (If you have uncommitted changes, this step with simply show an error without modifying the working directory. You can `commit` or `stash` your changes to continue.) If a previously-reviewed version of the package exists, it will be included in a prior commit, allowing you to use Git-based tools to review differences.

When you've reviewed the dependency, use `bitauth approve` to approve and sign the dependency, or `bitauth reject` to cancel and end the review process.

## `bitauth upgrade`

The `upgrade` command starts an interactive dependency upgrade process. The command lists all dependencies for which a newer version is available. You can choose a dependency to install and start the `bitauth review` process for that update.

If an update for BitAuth CLI is available, it can also be installed using this command.

## `bitauth verify`

The `verify` command simply checks that all artifacts in use have been signed according to the BitAuth configuration in your project.

## `bitauth config`

View and update both global (current user) and local (current project) BitAuth configuration. The command is interactive, and detailed help information is provided in context.

# FAQ

### What is an artifact?

Specifically, an artifact is a [compressed tarball](<https://en.wikipedia.org/wiki/Tar_(computing)>) of single top-level directory within your dependencies directory (the `node_modules` folder).

Artifacts may include native binaries or other files downloaded or generated during installation. Depending on your package manager (e.g. `npm` or `yarn`), it may include any number of its own dependencies with which it is reviewed.

If a sub-dependency is used by multiple dependencies, it may be lifted up to a top-level directory in `node_modules` by your package manager. In this case, the sub-dependency will become its own artifact, and is reviewed separately. To maximize interoperability, BitAuth CLI leaves these details to your package manager.

### Where are artifacts stored?

Artifacts are stored in a special Git branch managed by BitAuth CLI. By default, this branch is `bitauth/artifacts`.

This may be counter-intuitive. Generally, storing artifacts in Git is discouraged, because Git is designed for line-based version control, and binary files can unnecessarily bloat Git repositories. Additionally, dependencies can include huge numbers of files, which can be quite slow when pushing or pulling changes from a remote repository.

BitAuth CLI is designed to avoid these potential disadvantages. The `artifacts` branch can be easily pruned, reducing your repository size without effecting your project's history. This provides the reproducibility benefits of committing your dependencies without bloating your repo.

Additionally, artifacts in the `artifacts` branch are stored in compressed archives. This reduces the storage and transfer overhead from tracking many thousands of individual files.

Because source code is already tracked with Git, using a Git branch for artifact storage significantly simplifies configuration and deployment for most projects. We plan to offer other built-in artifact storage options, but we strongly encourage you to give the Git-based system a try.
