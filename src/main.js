import { DockerDevelopConfigLoader } from './configure';
import { DockerDevelopLauncher } from './launcher';
import { DockerDevelopWatcher} from './watcher';
import { DockerDevelopEnvProviderManager } from './provider';

export function watch(options) {
    // Load Configuration
    const configLoader = new DockerDevelopConfigLoader(options.config);

    // Launch Docker Applications and Watchers
    const launchers = [];
    configLoader.config.forEach(application => {
        const provider = new DockerDevelopEnvProviderManager(application.envProviderConfig);
        const launcher = new DockerDevelopLauncher(application.dockerConfig, provider);
        const watcher = new DockerDevelopWatcher(launcher, application.watchConfig);
        watcher.watch();
        launchers.push(launcher);
    });

    // Cleanup
    var shutdown = false;
    function exitHandler(options, exitCode) {
        if (!shutdown) {
            shutdown = true;
            launchers.forEach(launcher => {
                launcher.shutdown();
            });
        }

        if (exitCode == 'SIGINT') {
            process.exit();
        }
        else if (exitCode != 'exit' && exitCode != 0) {
            process.kill(1);
        }
    }

    process.stdin.resume();
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
    process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}