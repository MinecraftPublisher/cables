if (window) {
    global.require = (name) => {
        fetch('https://www.npmjs.com/package/' + name).then(response => {
            if (response.status === 404) {
                let dir_path = window.location.href.split('/').slice(0, window.location.href.split('/').length - 1).join('/') + '/'
                fetch(dir_path + name).then(response => {
                    if (response.status === 404) {
                        throw new ReferenceError('Error: Unable to find module.')
                    } else {
                        response.text().then(data => {
                            import('data:text/javascript;charset=utf-8;base64,' + btoa(data))
                        })
                    }
                })
            } else {
                import('https://unpkg.com/' + name)
            }
        })
    }
} else {
    throw new ReferenceError('Error: This module only works on the browser.')
}