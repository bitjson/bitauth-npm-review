# @bitauth/cli

Reliable security reviews for Node.js dependencies.

BitAuth CLI includes development tooling to:

- safely add and review untrusted dependencies and dependency updates
- sign and store reviewed artifacts
- safely install only from reviewed artifacts (for production)

## Getting Started

With [Node.js](https://nodejs.org/en/download/) v10 LTS or later, install the CLI globally:

```sh
npm i -g @bitauth/cli
```

It's important to install BitAuth CLI globally (`-g`), because you'll be using it to authenticate local dependencies. If BitAuth CLI were only installed locally, a malicious dependency could hide itself from review.

To add or review untrusted dependencies, you'll also need to [install Docker](https://docs.docker.com/install/). Docker is used both to sandbox dependencies during review and to install the proper versions of some native dependencies. When simply using `bitauth` to verify and install previously-signed packages (e.g. in a production environment), Docker is not necessary.

By default, your BitAuth user configuration and code-signing keys are stored at `~/.bitauth`. This can be configured using the `$BITAUTH_USER_CONFIG_PATH` environment variable.

### `bitauth init`

To begin locking down your project's dependencies, switch to the root directory of your project and run:

```sh
# cd my-project/
bitauth init
```

This will start the interactive setup process.

BitAuth CLI creates and operates within a `.bitauth` directory at the root of your project. This directory contains project configuration, signing identity information, and signatures. It's also used during the review process.

# Usage

BitAuth CLI includes commands to safely add and review new dependencies and updates, install previously-reviewed dependencies, verify code signatures, and more.

A summary of each command is provided below. You can also run `bitauth --help` for more information.

## `bitauth add [package-name]`

The `add` command is the best way to introduce new dependencies in a project. It's the safer alternative to `npm install [package-name]`.

```sh
# example: add a new package
bitauth add @bitauth/core
```

By default, new packages are added within a sandbox created using Docker. This provides several benefits:

- **package script isolation** – It prevents potentially-malicious package scripts from having full access to your machine. By default, it's possible for dependencies to execute untrusted code during installation (with both `npm` and `yarn`). This is critical to the install process for many packages, so disabling it is not always an option. Isolating the code provides immediate safety, while remaining fully-compatible.
- **ensures correct binaries** – It also ensures that, if present, any native binaries (generated or downloaded during the install process) are compatible with Linux.

When a package is added or updated, the resulting set of files is called an `artifact`. BitAuth CLI tracks and manages these artifacts, allowing you to carefully review them, code-sign them, and re-install the reviewed artifacts safely. For more information, see:

- [What is an artifact?](#what-is-an-artifact)
- [Where are artifacts stored?](#where-are-artifacts-stored)

If Docker is not available, the `add` command will fail.

## `bitauth install`

The `install` command installs approved artifacts. It's the safer alternative to `npm install`.

```sh
# example: safely install all dependencies
bitauth install
```

Only packages which meet your project's code-signing requirements will be installed. If an approved artifact for a required package is not available, the `install` command will error without modifying your working directory.

## `bitauth review`

The `review` command starts the interactive review process.

```sh
# select from a list of packages needing review
bitauth review
```

The interactive interface lets you select a package to review from among a list of your unreviewed packages. You can also skip this step by specifying a package directly:

```sh
# start reviewing "package-name" immediately
bitauth review package-name
```

BitAuth CLI uses [Git](https://git-scm.com/) to make reviews easier. When you've chosen a package to review, a new Git branch will be created (default: `bitauth/review`) from your current branch. (If you have uncommitted changes, this step with simply show an error without modifying the working directory. You can `commit` or `stash` your changes to continue.)

The artifact for review will be placed in your project at `.bitauth/reviews/ARTIFACT_ID`. If a previously-reviewed version of the artifact exists, it will be included in a prior commit, allowing you to use Git-based tools to review any differences.

When you've reviewed the dependency, use `bitauth approve` to approve and sign the dependency, or `bitauth reject` to cancel and end the review process.

## `bitauth upgrade`

The `upgrade` command starts an interactive dependency upgrade process.

The command lists all dependencies for which a newer version is available. You can choose a dependency from the list to update, and the update will be installed inside a sandbox (using Docker). You'll also have the option to immediately start a review for the newly created artifact.

If an update for BitAuth CLI is available, BitAuth CLI can also be upgraded using this command.

## `bitauth verify`

The `verify` command simply checks that all artifacts in use have been signed according to the BitAuth configuration in your project. (This also happens automatically before `bitauth install`.)

## `bitauth config`

View and update both user (`~/.bitauth`) and project (`.bitauth`) BitAuth configuration. The command is interactive, and detailed help information is provided in context.

## `bitauth deploy`

The `deploy` command is not an essential part of the BitAuth CLI workflow. It is a convenience method primarily for use by projects which are deployed using Platform as a Service (PaaS) services. Because these services often operate on a single Git branch, all requisite code must be present on the branch used for deployment.

```sh
# automatically update the deployment branch
bitauth deploy
```

This copies the state of the currently active Git branch into a new commit in the deployment branch managed by bitauth (by default, `bitauth deploy`). It also commits all in-use artifacts to `.bitauth/artifacts/`. When `bitauth install` runs, it will pull artifacts from this location, rather than the configured artifacts branch.

## `bitauth run [script]`

The `run` command provides a convenient method for running the given package script inside Docker:

```sh
# run the "start" script using Docker
bitauth run start
```

This is useful for projects which use native dependencies but don't yet have a way to ensure consistency across development environments.

Because artifacts are locked down, reviewed, and signed, if a project contributor is using a platform for development which is not supported by the signed native binaries (e.g. macOS or Windows), they may need to run those binaries in a Linux Container. Docker is a very performant option, and guarantees reproducibility across development environments.

Note, this should never be used in a Linux environment (e.g. production) – since Linux should already be supported by any native code in your reviewed artifacts.

## `bitauth prune`

the `prune` command is an interactive assistant which helps to reduce your Git repository size by migrating to new `artifacts` and `deploy` branches. With the old branches not in use, they can be safely deleted.

This process is designed to avoid overwriting history. This makes it much easier to thin down a repo – even with a large, distributed set of contributors. As contributors check out the updated configuration, they will automatically begin using the new, lighter-weight branch. They can then delete or archive the branch containing old, unused artifacts.

# FAQ

### What is an artifact?

Specifically, an artifact is a compressed archive of a single, top-level directory within your dependencies directory (the `node_modules` folder). Artifacts also include any native binaries or other files downloaded or generated during `add` or `update`.

Depending on the configured package manager (by default, `yarn`), the artifact may also contain some of its own sub-dependencies (e.g. if a dependency requires a specific sub-dependency version which conflicts with the version required by a different dependency).

Usually, sub-dependencies are "flattened" (brought up to the top-level in the dependencies directory), which means they become their own independent artifacts, and are reviewed separately. To maximize interoperability, BitAuth CLI currently leaves these details to the configured package manager.

### Where are artifacts stored?

Artifacts are stored in a special Git branch managed by BitAuth CLI. By default, this branch is `bitauth/artifacts`.

This may be counter-intuitive. Generally, storing artifacts in Git is discouraged, because Git is designed for line-based version control, and binary files can unnecessarily bloat Git repositories. Additionally, dependencies can include huge numbers of files, which can be quite slow when pushing or pulling changes from a remote repository.

BitAuth CLI is designed to avoid these potential disadvantages. The `artifacts` branch can be easily pruned, reducing your repository size without affecting your project's history. This provides the reproducibility benefits of committing your dependencies without bloating your repo.

Additionally, artifacts in the `artifacts` branch are stored in compressed archives. This reduces the storage and transfer overhead from tracking many individual files.

Because source code is already tracked with Git, using a Git branch for artifact storage significantly simplifies configuration and deployment for most projects. We plan to offer other built-in artifact storage options, but we strongly encourage you to give the Git-based system a try.
