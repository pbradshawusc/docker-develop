import { DockerDevelopAWSEnvProvider} from './aws';
import { DockerDevelopSimpleEnvProvider } from './simple';

export class DockerDevelopEnvProviderManager {
    constructor(config) {
        this.config = config;
        this.providers = {};
    }

    async provide() {
        var env = {};
        env = Object.assign(env, await this.provideSimple());
        env = Object.assign(env, await this.provideAWS());
        return env;
    }

    // Internals
    async provideSimple() {
        if (this.config) {
            if (this.config.simple) {
                if (!this.providers.simple) {
                    this.providers.simple = new DockerDevelopSimpleEnvProvider(this.config.simple);
                }
                return await this.providers.simple.provide();
            }
        }
        return {};
    }

    async provideAWS() {
        if (this.config) {
            if (this.config.aws) {
                if (!this.providers.aws) {
                    this.providers.aws = new DockerDevelopAWSEnvProvider(this.config.aws);
                }
                return await this.providers.aws.provide();
            }
        }
        return {};
    }
}