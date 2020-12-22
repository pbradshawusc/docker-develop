import arg from 'arg';
import inquirer from 'inquirer';
import { watch } from './main';

function parseArgumentsIntoOptions(rawArgs) {
 const args = arg(
   {
     '--config': String,
     '-c': '--config'
   },
   {
     argv: rawArgs.slice(2),
   }
 );
 return {
   config: args['--config'] || "./docker-develop.json"
 };
}

async function promptForMissingOptions(options) {
    const questions = [];
    // if (!options.template) {
    //   questions.push({
    //     type: 'list',
    //     name: 'template',
    //     message: 'Please choose which project template to use',
    //     choices: ['JavaScript', 'TypeScript'],
    //     default: defaultTemplate,
    //   });
    // }
   
    const answers = await inquirer.prompt(questions);
    return {
      ...options,
    //   template: options.template || answers.template
    };
   }
   
   export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    watch(options);
   }