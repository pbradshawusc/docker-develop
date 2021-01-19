const fs = require('fs');

export class DockerDevelopConfigLoader {
    constructor(configLocation) {
        if (!configLocation) {
            throw new Error(`Must provide a docker-develop config location`);
        }
        this.loadDockerWatchConfig(configLocation);
        this.validateDockerWatchConfig();
        this.mergeExtensionConfig();
    }

    loadDockerWatchConfig(configLocation) {
        // Base Config
        if (!fs.existsSync(configLocation)) {
            throw new Error(`Unable to find docker-develop config at location '${configLocation}'`);
        }
        const configContent = fs.readFileSync(configLocation).toString();
        this.config = JSON.parse(configContent);

        // Extension Config
        const extensionConfigLocation = `${configLocation.split('.json')[0]}.local.json`;
        if (fs.existsSync(extensionConfigLocation)) {
            const extensionConfigContent = fs.readFileSync(extensionConfigLocation).toString();
            this.extensionConfig = JSON.parse(extensionConfigContent);
        }
    }

    validateDockerWatchConfig() {
        // Base Config
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

    mergeExtensionConfig() {
        if (this.extensionConfig) {
            console.log(`Merging in detected local configuration`);
            console.log(this.extensionConfig);
            Object.keys(this.extensionConfig).forEach(key => {
                var matchFound = false;
                for (var i = 0; i < this.config.length; i++) {
                    if (key == this.config[i].dockerConfig.imageName) {
                        // Match found
                        matchFound = true;
                        if (this.extensionConfig[key].dockerConfig) {
                            if (this.extensionConfig[key].dockerConfig.buildArgs) {
                                this.config[i].dockerConfig.buildArgs.push(...this.extensionConfig[key].dockerConfig.buildArgs);
                            }
                            if (this.extensionConfig[key].dockerConfig.runArgs) {
                                this.config[i].dockerConfig.runArgs.push(...this.extensionConfig[key].dockerConfig.runArgs);
                            }
                        }
                        if (this.extensionConfig[key].watchConfig) {
                            this.config[i].watchConfig.push(...this.extensionConfig[key].watchConfig);
                        }
                    }
                }
                if (!matchFound) {
                    throw new Error(`Docker-develop local configuration contains image that is not part of the base configuration: ${key}`);
                }
            });
        }
    }
}