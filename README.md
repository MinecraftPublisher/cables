# cables
The All-In-One package manager for your CLI needs and deeds.

## How to install it?
Simply run the command below to clone cables, And create a symlink in the `/usr/local/bin/` directory.
```
sudo cd /usr/local/
sudo git clone https://github.com/MinecraftPublisher/cables.git
sudo cd cables
sudo npm i
sudo chmod +X ./bin/index.js
sudo node ./bin/index.js install cables
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