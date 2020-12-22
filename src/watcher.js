const fs = require('fs');

export class DockerDevelopWatcher {
    constructor(dockerLauncher, watchConfig) {
        if (!dockerLauncher) {
            throw new Error(`Must provide a Docker launcher`);
        }
        this.validateWatchConfig(watchConfig);
        this.dockerLauncher = dockerLauncher;
        this.watchConfig = watchConfig;
    }

    validateWatchConfig(watchConfig) {
        if (!watchConfig) {
            throw new Error(`Must provide a watch config`);
        }
        watchConfig.forEach(location => {
            if (!location.path) {
                throw new Error(`Watch locations must specify a path`);
            }
        });
    }

    watch() {
        this.dockerLauncher.restart();
        this.watchConfig.forEach(location => {
            fs.watch(location.path, { recursive: (location.recursive == undefined ? true : !!location.recursive) }, (eventType, filename) => {
                if (filename.match(new RegExp(location.regex || '*'))) {
                    this.dockerLauncher.restart();
                }
            });
        })
    }
}