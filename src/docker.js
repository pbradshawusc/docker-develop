const shell = require('shelljs');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');

// Handles the launch and relaunch of a Dockerized application
export class DockerDevelopLauncher {
    constructor(dockerConfig) {
        this.validateDockerConfig(dockerConfig);
        this.imageName = dockerConfig.imageName;
        this.root = dockerConfig.root || `.`
        this.buildArgs = dockerConfig.buildArgs || [];
        this.runArgs = dockerConfig.runArgs || [];
        this.dockerProcess = undefined;
        this.debounceMap = {};
    }

    validateDockerConfig(dockerConfig) {
        if (!dockerConfig) {
            throw new Error(`Must provide a Docker configuration`);
        }
        if (!dockerConfig.imageName) {
            throw new Error(`Must provide a Docker image name`);
        }
    }

    // Main methods
    launch() {
        console.log(`Launching ${this.imageName}...`);
        // Stringify Build Args
        var buildArgsString = "";
        this.buildArgs.forEach(arg => {
            buildArgsString += `${arg.join(' ')} `;
        });

        // Stringify Run Args
        var runArgsString = "";
        this.runArgs.forEach(arg => {
            runArgsString += `${arg.join(' ')} `;
        });

        // Launch Docker
        this.dockerProcess = shell.exec(`docker build ${buildArgsString ? buildArgsString : ''}-t '${this.imageName}' ${this.root} && docker run ${runArgsString ? runArgsString : ''}'${this.imageName}'`, { async: true, silent: true });

        // Handle logs
        this.dockerProcess.stdout.on('data', (data) => {
            process.stdout.write(chalk.blue(`[${this.imageName}] ${data}`));
        });
        this.dockerProcess.stderr.on('data', (data) => {
            process.stderr.write(chalk.red(`[${this.imageName}] ${data}`));
        });

        // Handle exit
        this.dockerProcess.on('exit', () => {
            this.onExit();
        });
    }

    shutdown() {
        if (this.dockerProcess) {
            console.log(`Shutting Down ${this.imageName}...`);
            this.dockerProcess.kill();
            this.dockerProcess = undefined;
            shell.exec(`docker rm $(docker stop $(docker ps -a -q --filter ancestor=${this.imageName} --format="{{.ID}}"))`, { silent: true });
        }
    }

    restart() {
        this.debounce('restart', () => {
            this.shutdown();
            this.debounce('launch', () => {
                this.launch()
            });
        });
    }

    // Lifecycle
    onExit(code, signal) {
        console.log(`${this.imageName} closed with code: ${code}`);
        this.dockerProcess = undefined;
    }

    // Throttling
    debounce(title, functor, timeout = 2000) {
        var requestId = uuidv4();
        this.debounceMap[title] = requestId;
        setTimeout(() => {
            if (this.debounceMap[title] == requestId) {
                functor();
            }
        }, timeout)
    }
}