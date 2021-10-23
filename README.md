# cables
The All-In-One package manager for your CLI needs and deeds.

## How to install it?
Simply run the command below to clone cables, And create a symlink in the `/usr/local/bin/` directory. All the downloaded files and your cables installation will be stored in the `/usr/local/cables` folder that you can remove or modify at any time.
```bash
git clone https://github.com/MinecraftPublisher/cables.git
cd cables
npm i
chmod +X ./bin/index.js
node ./bin/index.js install cables
```

## How to use it?
Use the help command! After installing cables, Just run `cables help` to get help on it.

## Want to use cables in a NodeJS file?
Simply use the installation API provided by cables:
```JS
const cables = require('cables')
console.log(cables) // Outputs the latest cables version
cables.install('package') // Installs the npm package named "package"
cables.install('https://url_goes_here.com/the/path/to/a/javascript/file.js') // Installs a NodeJS file from a URL, Under the name "file" ( Retrieved from the URL, As the file's name is "file.js" )
```
