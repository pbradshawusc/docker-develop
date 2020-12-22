# docker-develop

A simple CLI utility for developing with Docker locally and automatically rebuilding for changes.

[![npm version](https://badge.fury.io/js/docker-develop.svg)](https://www.npmjs.com/package/docker-develop)

## Contents

- [Installation](#installation)
  * [Prerequisites](#prerequisites)
- [Usage](#usage)
  * [Calling the CLI](#calling-the-cli)
  * [CLI Arguments](#cli-arguments)
  * [Configuration](#configuration)
- [Examples](#examples)
- [Core Concepts](#concepts)
  * [ConfigLoader](#configloader)
  * [Launcher](#launcher)
  * [Watcher](#watcher)
- [Release Notes](release-notes.md)

## Installation

The recommended usage is to install this package globally so that it can be used across any projects direct from the command line.

```bash
npm install -g docker-develop
```

To facilitate use across larger teams, this can also be installed as a developer dependency for projects using a Node script layer.

```bash
npm install --save-dev docker-develop
```

> Note that with the local installation, the CLI will need to be invoked via `npx` or within a custom NPM script.

### Prerequisites

The only prerequisites for `docker-develop` are Docker and Node. The CLI tool uses Docker CLI in the background, so please ensure that you have Docker appropriately installed and the Docker CLI available on your machine's PATH.

## Usage

### Calling the CLI

Invoking the CLI is as simple as follows. Within the root of your docker project:

```bash
docker-develop
```

> Note that at this time, your Docker and watch configuration cannot be auto-discovered. A docker-develop configuration file is required.

### CLI Arguments

The following additional arguments are supported in the `docker-develop` CLI:

| Flag | Description | Example |
| :--: | :-- | :-- |
| `--config`, `-c` | The location of your `docker-develop` configuration file. Defaults to `./docker-develop.json`. | `docker-develop -c docker-develop-alternate.json` |

### Configuration

`docker-develop` is configured via a JSON schema that can be provided at launch. At this time, the schema must be saved to disk and loaded via file path and cannot be provided via CLI arguments. By default, this schema is expected to be named `docker-develop.json` and live at the root where you invoke the `docker-develop` CLI command. However, you may specify a path to the configuration using the `--config` or `-c` CLI argument as outlined in [CLI Arguments](#cli-arguments).

The configuration schema is defined as below:

> Note that the root of the schema is an array containing one or multiple `docker-develop` configurations.

```JSON
[
    {
        "dockerConfig": {
            "imageName": {
                "type": "String",
                "description": "The tag (name) that you wish to use for your built Docker image. If desired, provide a tag with `:<tag>`. If not provided, Docker will automatically tag with 'latest'.",
                "required": true,
                "example": "sample-image"
            },
            "buildArgs": {
                "type": "Array<BuildArg>",
                "description": "List of arguments to provide to Docker during the `docker build` step.",
                "required": false,
                "default": [],
                "example": [ [ "--target", "dev" ] ],
                "customTypes": {
                    "BuildArg": {
                        "type": "Array<String>",
                        "description": "A single argument to provide to Docker during the `docker build` step. Each string in the array will be concatenated with a single space.",
                        "required": false,
                        "example": ["--target", "dev"]
                    }
                }
            },
            "runArgs": {
                "type": "Array<RunArg>",
                "description": "List of arguments to provide to Docker during the `docker run` step.",
                "required": false,
                "default": [],
                "example": [ [ "-p", "5000:80" ], [ "-e", "ENV_VAR=hello-world" ] ],
                "customTypes": {
                    "RunArg": {
                        "type": "Array<String>",
                        "description": "A single argument to provide to Docker during the `docker run` step. Each string in the array will be concatenated with a single space.",
                        "required": false,
                        "example": ["-p", "5000:80"]
                    }
                }
            }
        },
        "watchConfig": {
            "type": "Array<WatchConfiguration>",
            "description": "List of configurations describing directories to watch for changes as well as the filename patterns that should trigger the Docker application to restart. Required, but may be an empty array (`[]`) to specify no watched directories.",
            "required": true,
            "example": [
                {
                    "path": "./src",
                    "recursive": "true",
                    "regex": ".*"
                }
            ],
            "customTypes": {
                "WatchConfiguration": {
                    "path": {
                        "type": "String",
                        "description": "The path (absolute or relative when using `.`) to a directory to watch for changes.",
                        "required": true,
                        "example": "./src"
                    },
                    "recursive": {
                        "type": "Boolean",
                        "description": "Whether to watch the directory recursively into subdirectories (true) or to only watch the top level specified directory (false).",
                        "required": false,
                        "default": true,
                        "example": true
                    },
                    "regex": {
                        "type": "String",
                        "description": "The regular expression pattern to test against filenames when a change is detected. If the pattern is a match, relaunch the associated Docker application. If the pattern is not a match, ignore the change and do nothing.",
                        "required": false,
                        "default": ".*",
                        "example": ".*"
                    }
                }
            }
        }
    },
    // ...
]
```

Example configuration:

```JSON
[
    {
        "dockerConfig": {
            "imageName": "sample-application",
            "buildArgs": [
                ["--target", "dev"]
            ],
            "runArgs": [
                ["-p", "5000:80"],
                ["-p", "5001:5678"],
                ["-e", "EnvironmentVariable=hello-world"]
            ]
        },
        "watchConfig": [
            {
                "path": "./src",
                "recursive": true,
                "regex": ".*"
            },
            {
                "path": ".",
                "recursive": false,
                "regex": "Dockerfile|.dockerignore|package.json"
            }
        ]
    }
]
```

## Examples

| Example | Description | Run Instructions |
| :-- | :-- | :-- |
| [Single Image Watch](examples/singleImage) | Launching a single Hello World web application and watching the source HTML for changes. Available on `localhost:8080`. | From `examples/singleImage`, run `docker-develop` |
| [Alternate Configuration](examples/singleImage) | Launching a single Hello World web application with an alternate configuration and watching the source HTML for changes. Available on `localhost:8081`. | From `examples/singleImage`, run `docker-develop --config docker-develop-alternate.json` or `docker-develop -c docker-develop-alternate.json` |
| [Multiple Image Watch](examples/multipleImages) | Launching two Hellow World web applications and watching the source HTML of each for changes. Each container rebuilds and relaunches only for changes to it's own source. Available on `localhost:8080` and `localhost:8081`. | From `examples/multipleImages`, run `docker-develop` |

## Core Concepts

### ConfigLoader

The `DockerDevelopConfigLoader` finds and then loads the `docker-develop` configuration file. This configuration is then used to determine which Docker applications should be launched as well as what configuration should be used to trigger relaunching each container.

### Launcher

The `DockerDevelopLauncher` handles the building and launching of a given Docker image/container. A single launcher is created for each configuration found in the `docker-develop` configuration and maintains the lifecycle of that Docker application. The launcher utilizes the Docker CLI in order to facilitate these actions.

Build and run arguments are passed into the Docker CLI so that the Docker run configuration is fully configurable.

Additionally, restart requests are debounced to prevent flooding the application with stop and start commands. Please allow a couple of seconds for the restart process to initiate.

### Watcher

The `DockerDevelopWatcher` handles watching the filesystem for changes according to the specified watch configuration. Upon a change that matches the provided regex pattern (or `\.*\` if not provided), the watcher will restart the provided `DockerLauncher`.