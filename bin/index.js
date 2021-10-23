#!/usr/bin/env node

/* 
 * Cables
 * The All-In-One package manager for your CLI needs and deeds.
 */

let version = '4.1.0'
let isWin = process.platform === 'win32'
let args = process.argv.slice(2)
let path = '/usr/local/cables/'
const fetch = require('node-fetch')
const chalk = require('chalk')
const shell = require('shelljs')
const fs = require('fs')
function isCurrentUserRoot() {
    return process.getuid() === 0;
}
let filepath = module.filename
if (!isCurrentUserRoot()) { path = '/' + filepath.substring(1, filepath.length - 'bin/index.js'.length); }
let silent = fs.existsSync(path + 'silent.conf') ? fs.readFileSync(path + 'silent.conf').toString() : 'true'
if (!globalThis.fetch) { globalThis.fetch = fetch; }
shell.config.silent = silent === 'true'
if (isWin && args.length !== 0 && silent === 'false') {
    console.log(chalk.redBright.bold('Error: We still haven\'t figured out a way to create symlinks on Windows, Sorry about that.'))
    process.exit()
}

if (!isCurrentUserRoot()) { if(args.length !== 0 && silent === 'false') { console.log(chalk.redBright.bold('Error: Cables needs to be ran as sudo, However we have a fallback. We\'ve got you. Next time, Use cables as sudo.')) } }


const tools = {
    'help': () => {
        console.log(
            chalk.green.bold('Cables Package Manager v' + version + '\n') +
            chalk.yellowBright('help') + chalk.blueBright('                                 Show this menu\n') +
            chalk.yellowBright('version') + chalk.blueBright('                              Get the current cables version\n') +
            chalk.yellowBright('path') + chalk.blueBright('                                 Show the installation path of cables\n') +
            chalk.yellowBright('update') + chalk.blueBright('                               Updates cables to the latest version\n') +
            chalk.yellowBright('install <PACKAGE_NAME_OR_URL>') + chalk.blueBright('        Install a package\n') +
            chalk.yellowBright('remove <PACKAGE_NAME_OR_URL>') + chalk.blueBright('         Uninstall a package\n') +
            chalk.yellowBright('silent') + chalk.blueBright('                               Toggle between silent mode, Determines wether messages should be logged or no\n') +
            chalk.yellowBright('clean') + chalk.blueBright.bold('                                This command removes ALL of your existing packages and unlinks them, Be careful.\n') +
            chalk.greenBright('Cables also creates symlinks of all installed packages in ') + chalk.yellowBright.bgBlueBright('/usr/local/bin/') + chalk.greenBright(' to prevent frustration.\n') +
            '\n\n'
        )
    },
    'clean': () => {
        fs.readdirSync(path + 'cables_files').forEach((file) => {
            let name = file.split('/')[file.split('/').length - 1].split('.')[0]
            fs.unlinkSync(path + name)
            fs.unlinkSync(file)
        })
        JSON.parse(fs.readFileSync(path + 'package.json').toString()).keys.forEach((package) => {
            if (!(package === 'chalk' || package === 'shelljs')) {
                fs.unlinkSync(path + package)
                shell.exec('npm uninstall ' + package)
            }
        })
    },
    'update': () => {
        tools['patch']('cables')
        /*
        console.log(chalk.bold('Fetching data...'))
        fetch('https://raw.githubusercontent.com/MinecraftPublisher/cables/main/bin/index.js').then((response) => {
            console.log(chalk.bold('Converting data into plaintext...'))
            response.text().then((data) => {
                console.log(chalk.bold('Writing data to the file...'))
                fs.writeFileSync(filepath, data)
                console.log(chalk.bold('Creating symlink...'))
                fs.symlink(
                    filepath,
                    '/usr/local/bin/cables',
                    'file', (err) => {
                        if (err) {
                            if (!err.toString().startsWith('Error: EEXIST: file already exists,')) {
                                console.log(chalk.redBright.bold(err))
                            } else {
                                fs.unlinkSync('/usr/local/bin/cables')
                                tools['update']()
                                console.log(chalk.greenBright.bold('Cables has been updated to version ' + data.split('\n')[19].substring(15, data.split('\n')[19].length - 1) + '!'))
                            }
                        } else {
                            console.log(chalk.greenBright.bold('Cables has been updated to version ' + data.split('\n')[19].substring(15, data.split('\n')[19].length - 1) + '!'))
                        }
                    })
            })
        })
         */
    },
    'patch': (name_or_url) => {
        if (/* name_or_url === 'cables' */ 2 + 2 === 5)
            tools['update']()
        else {
            fetch('https://npmjs.com/package/' + name_or_url).then((response) => {
                if (response.status !== 404) {
                    console.log(chalk.greenBright('Found an NPM package on the registry! Starting NPM cloning...'))
                    shell.exec('npm i ' + name_or_url + ' --prefix ' + path, function (code, stdout, stderr) {
                        console.log(chalk.bold('Successfully fetched package from NPM, Trying to patch files...'))
                        let patchPath = path + 'node_modules/' + name_or_url + '/'
                        let JSONfile = JSON.parse(fs.readFileSync(patchPath + 'package.json').toString() || '{}')
                        if (JSONfile === {}) {
                            console.log(chalk.redBright.bold('Error: Invalid package.json file.'))
                        } else {
                            console.log(chalk.bold('Found the package.json file! Patching...'))
                            if (JSONfile.hasOwnProperty('bin')) {
                                console.log(chalk.bold('package.json has no issues.'))
                            } else {
                                console.log(chalk.bold('package.json does not include a BIN file, Generating one...'))
                                JSONfile['bin'] = {}
                                JSONfile['bin'][name_or_url] = JSONfile['main'] || 'echo Cables Error: Couldn\'t find the main file.'
                            }
                            fs.writeFileSync(patchPath + 'package.json', JSON.stringify(JSONfile))
                            console.log(chalk.bold('Patch succeeded, Attempting to fix the node path...'))
                            let file = fs.readFileSync(patchPath + Object.values(JSONfile['bin'])[0]).toString().split('\n')
                            if (file[0] === '#!/usr/bin/env node') {
                                console.log(chalk.bold('The node path already exists!'))
                            } else {
                                file.unshift('#!/usr/bin/env node')
                                fs.writeFileSync(patchPath + Object.values(JSONfile['bin'])[0], file.join('\n'))
                                console.log(chalk.bold('The node path has been fixed!'))
                            }
                            console.log(chalk.bold('Creating symlink...'))
                            fs.symlink(
                                patchPath + Object.values(JSONfile['bin'])[0],
                                '/usr/local/bin/' + Object.keys(JSONfile['bin'])[0],
                                'file', (err) => {
                                    if (err) {
                                        if (err.toString().startsWith('Error: EEXIST: file already exists,')) {
                                            console.log(chalk.yellowBright.bold('Package already installed!'))
                                            fs.unlinkSync('/usr/local/bin/' + Object.keys(JSONfile['bin'])[0])
                                            tools['patch'](name_or_url)
                                        } else {
                                            console.log(chalk.redBright.bold(err))
                                        }
                                    } else {
                                        console.log(chalk.bold('Symlink creation successful!'))
                                        console.log(chalk.greenBright.bold('Successfully installed ' + name_or_url))
                                    }
                                })
                        }
                    })
                } else if ((name_or_url.startsWith('https://') || name_or_url.startsWith('http://'))) {
                    if (name_or_url.endsWith('.js')) {
                        console.log(chalk.greenBright('Valid URL detected, Trying to download the contents...'))
                        fetch(name_or_url).then((response) => {
                            response.text().then((data) => {
                                console.log(chalk.bold('Trying to patch the file...'))
                                let file = data.split('\n')
                                let name = name_or_url.split('/')[name_or_url.split('/').length - 1].split('.')[0]
                                if (file[0] === '#!/usr/bin/env node') {
                                    console.log(chalk.bold('The node path already exists!'))
                                } else {
                                    file.unshift('#!/usr/bin/env node')
                                    console.log(chalk.bold('The node path was added successfully!'))
                                }
                                fs.writeFileSync(path + 'cables_files/' + name + '.js', file.join('\n'))
                                shell.chmod('+x', path + 'cables_files/' + name + '.js')
                                console.log(chalk.bold('Saved the file! Creating a symlink...'))
                                fs.symlink(
                                    path + 'cables_files/' + name + '.js',
                                    '/usr/local/bin/' + name,
                                    'file', (err) => {
                                        if (err) {
                                            if (err.toString().startsWith('Error: EEXIST: file already exists,')) {
                                                console.log(chalk.yellowBright.bold('Package already installed!'))
                                                fs.unlinkSync('/usr/local/bin/' + name)
                                                tools['patch'](name_or_url)
                                            } else {
                                                console.log(chalk.redBright.bold(err))
                                            }
                                        } else {
                                            console.log(chalk.greenBright.bold('Symlink creation successful!'))
                                            console.log(chalk.greenBright.bold('Successfully installed ' + name))
                                        }
                                    })
                            })
                        })
                    } else {
                        console.log(chalk.red.bold('Error: The given URL is not a valid Javascript file.'))
                    }
                } else {
                    console.log(chalk.red.bold('Error: The input is neither a valid URL nor a valid NPM package.'))
                }
            })
        }
    },
    'remove': (name) => {
        if (fs.existsSync('/usr/local/bin/' + name)) {
            console.log(chalk.bold('Removing package...'))
            shell.exec('cd ' + path + 'cables_files && rm ' + name + '.js && npm uninstall ' + name, function (code, stdout, stderr) {
                console.log(chalk.bold('Removing symlink...'))
                fs.unlinkSync('/usr/local/bin/' + name)
                console.log(chalk.greenBright.bold('Package successfully removed!'))
            })
        } else {
            console.log(chalk.red.bold('Error: The requested package isn\'t installed!'))
        }
    }
}

if (args.length === 2) {
    if (args[0] === 'install') {
        tools['patch'](args[1])
    } else if (args[0] === 'remove') {
        tools['remove'](args[1])
    } else {
        console.log(chalk.redBright.bold('Error: Unknown command! Try running the help command.'))
    }
} else if (args.length === 1) {
    if (args[0] === 'help') {
        tools['help']()
    } else if (args[0] === 'update') {
        tools['update']()
    } else if (args[0] === 'clean') {
        tools['clean']()
    } else if (args[0] === 'install') {
        console.log(chalk.redBright.bold('Error: Not enough arguments, Try running the help command.'))
    } else if (args[0] === 'version') {
        console.log(chalk.yellowBright.bold('Cables package manager v' + version))
    } else if (args[0] === 'silent') {
        if(silent === 'true') {
            console.log(chalk.greenBright.bold('Silent mode turned off'))
            fs.writeFileSync(path + 'silent.conf', 'false')
        } else {
            console.log(chalk.greenBright.bold('Silent mode turned on'))
            fs.writeFileSync(path + 'silent.conf', 'true')
        }
    } else if (args[0] === 'path') {
        console.log(
            chalk.greenBright.bold(
                'Cables executable path: ' + filepath + '\n' +
                'Cables installation directory: ' +
                path
            )
        )
    } else {
        console.log(chalk.redBright.bold('Error: Unknown command! Try running the help command.'))
    }
} else if (silent === 'false') {
    tools['help']()
}


module.exports = {
    'version': 'cables v' + version,
    'install': tools['patch'],
    'update': tools['update']
}