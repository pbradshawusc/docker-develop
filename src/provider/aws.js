import { DockerDevelopBaseEnvProvider} from './base';
const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');

export class DockerDevelopAWSEnvProvider extends DockerDevelopBaseEnvProvider {
    constructor(config) {
        super(config);
    }

    validateConfig(config) {
        if (config.profile) {
            this.profile = config.profile;
        }
    }

    async provideEnvVariables() {
        console.log("Providing AWS ENV variables...");
        var profileCreds = {
            profile: "",
            secretAccessKey: "",
            accessKeyId: "",
            region: ""
        };
        const awsProfiles = this.discoverAWSProfiles();
        profileCreds = await this.selectProfile(awsProfiles, this.profile);
        console.log("AWS ENV variables found");
        return {
            AWS_REGION: profileCreds.region,
            AWS_ACCESS_KEY_ID: profileCreds.accessKeyId,
            AWS_SECRET_ACCESS_KEY: profileCreds.secretAccessKey
        }
    }

    // Internals
    discoverAWSProfiles() {
        // Setup
        console.log("Discovering AWS profiles on machine...");
        const foundProfiles = {};
        const credsLocation = `${require('os').homedir()}/.aws/credentials`;
        const configLocation = `${require('os').homedir()}/.aws/config`;

        // Collect credentials
        if (fs.existsSync(credsLocation)){
            const content = fs.readFileSync(credsLocation).toString();
            const profiles = content.split('[');
            profiles.forEach((profile) => {
                if (profile.length) {
                    const profileName = profile.split(']')[0];
                    var profileAccessKeyId = "";
                    var profileSecretAccessKey = "";
    
                    const splitProfileLines = profile.split('\n');
                    splitProfileLines.forEach((line) => {
                        if (line.startsWith("aws_access_key_id")) {
                            profileAccessKeyId = line.split("=")[1].trim();
                        }
                        else if (line.startsWith("aws_secret_access_key")) {
                            profileSecretAccessKey = line.split("=")[1].trim();
                        }
                    });
    
                    foundProfiles[profileName] = {
                        profile: profileName,
                        accessKeyId: profileAccessKeyId,
                        secretAccessKey: profileSecretAccessKey,
                        region: "us-east-1"
                    }
                }
            });
        }

        // Collect configs
        if (fs.existsSync(configLocation)){
            const content = fs.readFileSync(configLocation).toString();
            const profiles = content.split('[');
            profiles.forEach((profile) => {
                if (profile.length) {
                    var profileName = profile.split(']')[0];
                    if (profileName.startsWith("profile ")) {
                        profileName = profileName.split("profile ")[1];
                    }
                    var profileRegion = "";
    
                    const splitProfileLines = profile.split('\n');
                    splitProfileLines.forEach((line) => {
                        if (line.startsWith("region")) {
                            profileRegion = line.split("=")[1].trim();
                        }
                    });
    
                    if (foundProfiles[profileName]) {
                        foundProfiles[profileName].region = profileRegion;
                    }
                }
            });
        }

        return foundProfiles;
    }

    async selectProfile(profiles, choice) {
        console.log("Determining profile to use...");
        if (Object.keys(profiles).length > 0) {
            if (choice) {
                if (Object.keys(profiles).includes(choice)) {
                    return profiles[choice];
                }
                else {
                    console.log(chalk.red(`Specified AWS Profile ${choice} not found on this machine. Application functionality may be degraded. Please add the ${choice} profile or change the selected profile.`));
                }
            }
            else {
                var options = Object.keys(profiles);
                const answer = await inquirer.prompt({
                    type: "list",
                    name: 'profile',
                    message: 'Please select a profile to use discovered credentials',
                    choices: options
                });
                return profiles[answer.profile];
            }
        }
        else {
            console.log(chalk.red(`No AWS Profiles found on this machine. Application functionality may be degraded. Please add at least one profile or remove the AWS provider.`));
            return {
                profile: "",
                secretAccessKey: "",
                accessKeyId: "",
                region: ""
            };
        }
    }
}