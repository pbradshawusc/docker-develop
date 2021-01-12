// Base class for providing env variables dynamically
export class DockerDevelopBaseEnvProvider {
    constructor(config) {
        this.validateConfig(config);
        this.config = config;
        this.providedEnv = undefined;
    }

    // Abstract Methods
    validateConfig(config) {
        throw new Error(`Env Provider validateConfig not implemented`);
    }

    async provideEnvVariables() {
        throw new Error(`Env Provider provide not implemented`);
    }

    // External implementation
    async provide() {
        if (!this.providedEnv) {
            this.providedEnv = await this.provideEnvVariables();
        }
        return this.providedEnv;
    }
}