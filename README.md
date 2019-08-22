[![Version](https://img.shields.io/npm/v/@bitauth/cli.svg)](https://npmjs.org/package/@bitauth/cli)
[![CircleCI](https://circleci.com/gh/bitauth/bitauth-cli/tree/master.svg?style=shield)](https://circleci.com/gh/bitauth/bitauth-cli/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/bitauth/bitauth-cli?branch=master&svg=true)](https://ci.appveyor.com/project/bitauth/bitauth-cli/branch/master)
[![Codecov](https://codecov.io/gh/bitauth/bitauth-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/bitauth/bitauth-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@bitauth/cli.svg)](https://npmjs.org/package/@bitauth/cli)
[![License](https://img.shields.io/npm/l/@bitauth/cli.svg)](https://github.com/bitauth/bitauth-cli/blob/master/package.json)

# @bitauth/cli

BitAuth is a universal identity resolution and message authentication standard.

# Getting Started

With [Node.js](https://nodejs.org/en/download/) v10 LTS or later, install the CLI globally:

```sh
git clone https://github.com/bitauth/bitauth-cli.git
cd bitauth-cli
yarn && yarn link

# Note, not yet available on NPM
# npm i -g @bitauth/cli
```

# Reference

<!-- disabed:toc -->
<!-- disabed:tocstop -->

<!-- disabed:usage -->
<!-- disabed:usagestop -->

BitAuth CLI includes commands to create and manage BitAuth identities, sign files and messages, verify existing BitAuth signatures, and more.

Below you'll find the [`help`](#bitauth-help-command) output for all available commands.

## Commands

<!-- commands -->

- [`bitauth add PACKAGE-NAME`](#bitauth-add-package-name)
- [`bitauth autocomplete [SHELL]`](#bitauth-autocomplete-shell)
- [`bitauth config`](#bitauth-config)
- [`bitauth deploy`](#bitauth-deploy)
- [`bitauth exec`](#bitauth-exec)
- [`bitauth help [COMMAND]`](#bitauth-help-command)
- [`bitauth init`](#bitauth-init)
- [`bitauth install`](#bitauth-install)
- [`bitauth prune`](#bitauth-prune)
- [`bitauth review [PACKAGE-NAME]`](#bitauth-review-package-name)
- [`bitauth run SCRIPT`](#bitauth-run-script)
- [`bitauth update [CHANNEL]`](#bitauth-update-channel)
- [`bitauth upgrade`](#bitauth-upgrade)

## `bitauth add PACKAGE-NAME`

add a new dependency to the project

```
USAGE
  $ bitauth add PACKAGE-NAME

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This command is the best way to introduce new dependencies in a project. It's the safer alternative to "npm install".

EXAMPLE
  $ bitauth add @bitauth/core
```

_See code: [src/commands/add.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/add.ts)_

## `bitauth autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ bitauth autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ bitauth autocomplete
  $ bitauth autocomplete bash
  $ bitauth autocomplete zsh
  $ bitauth autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.0/src/commands/autocomplete/index.ts)_

## `bitauth config`

view and update bitauth configuration

```
USAGE
  $ bitauth config

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  View and update both user-level and project-level bitauth configuration. The command is interactive, and detailed help
  information is provided in context.

EXAMPLE
  $ bitauth config
```

_See code: [src/commands/config.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/config.ts)_

## `bitauth deploy`

create a new deployment commit

```
USAGE
  $ bitauth deploy

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This command is not an essential part of the BitAuth CLI workflow. It is a convenience method primarily for use by
  projects which are deployed using Platform as a Service (PaaS) services. Because these services often operate on a
  single Git branch, all requisite code must be present on the branch used for deployment.

  This copies the state of the currently active Git branch into a new commit in the deployment branch managed by bitauth
  (by default, `bitauth deploy`). It also commits all in-use artifacts to `.bitauth/artifacts/`. When `bitauth install`
  runs, it will pull artifacts from this location, rather than the configured artifacts branch.

EXAMPLE
  # automatically update the deployment branch
  $ bitauth deploy
```

_See code: [src/commands/deploy.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/deploy.ts)_

## `bitauth exec`

execute a shell command via linux

```
USAGE
  $ bitauth exec

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This command provides a convenient method for running the given shell command inside Docker. It's like `npx`, `yarn
  exec`, or `pnpx` in that it supports commands provided by installed dependencies. See the help information for the
  `run` command for details.

EXAMPLE
  # TODO: examples
  $ bitauth exec lscpu
```

_See code: [src/commands/exec.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/exec.ts)_

## `bitauth help [COMMAND]`

display help for bitauth

```
USAGE
  $ bitauth help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.6/src/commands/help.ts)_

## `bitauth init`

prepare a project to use bitauth

```
USAGE
  $ bitauth init

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This will start the interactive setup process.

EXAMPLE
  $ bitauth init
```

_See code: [src/commands/init.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/init.ts)_

## `bitauth install`

install all approved artifacts

```
USAGE
  $ bitauth install

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  The `install` command verifies signatures and installs all required, approved artifacts. It's the safer alternative to
  npm/yarn/pnpm `install`.

  Only packages which meet your project's code-signing requirements will be installed. If an approved artifact for a
  required package is not available, the `install` command will error without modifying your working directory.

EXAMPLE
  # safely install all dependencies
  $ bitauth install
```

_See code: [src/commands/install.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/install.ts)_

## `bitauth prune`

start the repo-pruning assistant

```
USAGE
  $ bitauth prune

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This command is an interactive assistant which helps to reduce your Git repository size by migrating to new
  `artifacts` and `deploy` branches. With the old branches not in use, they can be safely deleted.

  This process is designed to avoid overwriting history. This makes it much easier to thin down a repo – even with a
  large, distributed set of contributors. As contributors check out the updated configuration, they will automatically
  begin using the new, lighter-weight branch. They can then delete or archive the branches containing old, unused
  artifacts.

EXAMPLE
  $ bitauth prune
```

_See code: [src/commands/prune.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/prune.ts)_

## `bitauth review [PACKAGE-NAME]`

start a review

```
USAGE
  $ bitauth review [PACKAGE-NAME]

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This command starts the interactive review process. The interactive interface lets you select a package to review from
  among a list of your unreviewed packages. You can also skip this step by specifying a package directly.

EXAMPLE
  $ bitauth review
  $ bitauth review @bitauth/core
```

_See code: [src/commands/review.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/review.ts)_

## `bitauth run SCRIPT`

run a package script via linux

```
USAGE
  $ bitauth run SCRIPT

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  This command provides a convenient method for running the given package script inside Docker.

  This is useful for projects which use native dependencies but don't yet have a way to ensure consistency across
  development environments.

  Because artifacts are locked down, reviewed, and signed, if a project contributor is using a platform for development
  which is not supported by the signed native binaries (e.g. macOS or Windows), they may need to run those binaries in a
  Linux Container. Docker is a very performant option, and guarantees reproducibility across development environments.

  Note, this should never be used in a Linux environment (e.g. production) – since Linux should already be supported by
  any native code in your reviewed artifacts.

EXAMPLE
  # run the "start" script using Docker
  $ bitauth run start

  # run the "serve" script
  $ bitauth run serve
```

_See code: [src/commands/run.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/run.ts)_

## `bitauth update [CHANNEL]`

update the bitauth CLI

```
USAGE
  $ bitauth update [CHANNEL]
```

_See code: [@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v1.3.9/src/commands/update.ts)_

## `bitauth upgrade`

start the interactive upgrade process

```
USAGE
  $ bitauth upgrade

OPTIONS
  -h, --help  show CLI help

DESCRIPTION
  `upgrade` lists all dependencies for which a newer version is available. You can choose a dependency from the list to
  update, and the update will be installed inside a sandbox (using Docker). You'll also have the option to immediately
  start a review for the newly created artifact.

EXAMPLE
  $ bitauth upgrade
```

_See code: [src/commands/upgrade.ts](https://github.com/bitauth/bitauth-cli/blob/v0.0.0/src/commands/upgrade.ts)_

<!-- commandsstop -->
