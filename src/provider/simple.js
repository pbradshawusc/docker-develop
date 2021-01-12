import { DockerDevelopBaseEnvProvider} from './base';

export class DockerDevelopSimpleEnvProvider extends DockerDevelopBaseEnvProvider {
    constructor(config) {
        super(config);
    }

    validateConfig(config) {
        
    }

    async provideEnvVariables() {
        console.log("Passing through simple ENV variables...");
        return this.config;
    }
}