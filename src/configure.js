const fs = require('fs');

export class DockerDevelopConfigLoader {
    constructor(configLocation) {
        if (!configLocation) {
            throw new Error(`Must provide a docker-develop config location`);
        }
        this.loadDockerWatchConfig(configLocation);
        this.validateDockerWatchConfig();
    }

    loadDockerWatchConfig(configLocation) {
        if (!fs.existsSync(configLocation)) {
            throw new Error(`Unable to find docker-develop config at location '${configLocation}'`);
        }
        const configContent = fs.readFileSync(configLocation).toString();
        this.config = JSON.parse(configContent);
    }

    validateDockerWatchConfig() {
        if (!this.config) {
            throw new Error(`Must provide a docker-develop config`);
        }
        if (!Array.isArray(this.config)) {
            throw new Error(`Docker-develop config must be of type Array`);
        }
        if (!this.config.length) {
            throw new Error(`Docker-develop config must contain at least one configuration object`);
        }
        this.config.forEach(config => {
            // Validate Docker Config
            if (!config.dockerConfig) {
                throw new Error(`Docker-develop configurations must specify a Docker config`);
            }
            if (!config.dockerConfig.imageName) {
                throw new Error(`Docker config must specify an image name`);
            }

            // Validate Watch Config
            if (!config.watchConfig) {
                throw new Error(`Docker-develop configurations must specify a watch config`);
            }
            config.watchConfig.forEach(watchConfig => {
                if (!watchConfig.path) {
                    throw new Error(`Watch config must specify a path`);
                }
            })
        });
    }
}