#!/usr/bin/env node

/* 
 * Cables
 * The All-In-One package manager for your CLI needs and deeds.
 */

let isWin = process.platform === 'win32'
if (isWin) {
    console.clear()
    console.log(chalk.redBright.bold('Error: We still haven\'t figured out a way to create symlinks on Windows, Sorry about that.'))
    process.exit()
}

const chalk = require('chalk')
const fetch = require('node-fetch')
const shell = require('shelljs')
const fs = require('fs')

let version = '3.3.1'
let filepath = module.filename
let path = '/usr/local/cables/'
let args = process.argv.slice(2)
if (!globalThis.fetch) { globalThis.fetch = fetch; }
shell.mkdir(path + 'cables_files')
const tools = {
    'help': () => {
        console.clear()
        console.log(
            chalk.green.bold('Cables Package Manager v' + version + '\n') +
            chalk.yellowBright('help') + chalk.blueBright('                                 Show this menu\n') +
            chalk.yellowBright('update') + chalk.blueBright('                               Updates cables to the latest version\n') +
            chalk.yellowBright('install <PACKAGE_NAME_OR_URL>') + chalk.blueBright('        Install a package\n') +
            chalk.yellowBright('remove <PACKAGE_NAME_OR_URL>') + chalk.blueBright('         Uninstall a package\n') +
            chalk.yellowBright('clean') + chalk.blueBright.bold('                                 This command removes ALL of your existing packages and unlinks them, Be careful.\n') + 
            chalk.greenBright('Cables also creates symlinks of all installed packages in ') + chalk.yellowBright.bgBlueBright('/usr/local/bin/') + chalk.greenBright(' to prevent frustration.\n') +
            '\n\n'
        )
    },
    'clean': () => {
        fs.readdirSync(path + 'cables_files').forEach((file) => {
            let name = file.split('/')[file.split('/').length - 1].split('.')[0]
            fs.unlinkSync('/usr/local/bin/' + name)
            fs.unlinkSync(file)
        })
        JSON.parse(fs.readFileSync(path + 'package.json').toString()).keys.forEach((package) => {
            if(!(package === 'chalk' || package === 'shelljs')) {
                fs.unlinkSync('/usr/local/bin/' + package)
                shell.exec('npm uninstall ' + package)
            }
        })
    },
    'update': () => {
        console.clear()
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
                                console.clear()
                                tools['update']()
                                console.log(chalk.greenBright.bold('Cables has been updated to version ' + data.split('\n')[19].substring(15, data.split('\n')[12].length - 1) + '!'))
                            }
                        } else {
                            console.log(chalk.greenBright.bold('Cables has been updated to version ' + data.split('\n')[19].substring(15, data.split('\n')[12].length - 1) + '!'))
                        }
                    })
            })
        })
    },
    'patch': (name_or_url) => {
        if (name_or_url == 'cables')
            tools['update']()
        else {
            fetch('https://npmjs.com/package/' + name_or_url).then((response) => {
                if (response.status !== 404) {
                    console.log(chalk.greenBright('Found an NPM package on the registry! Starting NPM cloning...'))
                    shell.exec('cd ' + path + 'cables_files/ && npm i ' + name_or_url, function (code, stdout, stderr) {
                        console.log(chalk.bold('Successfully fetched package from NPM, Trying to patch files...'))
                        let patchPath = path + 'node_modules/' + name_or_url + '/'
                        let JSONfile = JSON.parse(fs.readFileSync(patchPath + 'package.json').toString() || '{}')
                        if (JSONfile == {}) {
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
                            if (file[0] == '#!/usr/bin/env node') {
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
                                        console.log(chalk.greenBright.bold('Symlink creation successful!'))
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
                                if (file[0] == '#!/usr/bin/env node') {
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
    if (args[0] == 'install') {
        tools['patch'](args[1])
    } else if (args[0] == 'remove') {
        tools['remove'](args[1])
    } else {
        console.clear()
        console.log(chalk.redBright.bold('Error: Unknown command! Try running the help command.'))
    }
} else if (args.length === 1) {
    if (args[0] == 'help') {
        tools['help']()
    } else if (args[0] == 'update') {
        tools['update']()
    } else if (args[0] == 'clean') {
        tools['clean']()
    } else if (args[0] == 'install') {
        console.clear()
        console.log(chalk.redBright.bold('Error: Not enough arguments, Try running the help command.'))
    } else {
        console.clear()
        console.log(chalk.redBright.bold('Error: Unknown command! Try running the help command.'))
    }
} else {
    tools['help']()
}

module.exports = {
    'version': 'cables v' + version,
    'install': tools['patch'],
    'update': tools['update']
}