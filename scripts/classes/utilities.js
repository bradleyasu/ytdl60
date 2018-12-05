class Util {
    constructor() {

    }

    static randHash(length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

        if (! length) {
            length = Math.floor(Math.random() * chars.length);
        }

        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }

    static removeByAttr(arr, attr, value){
        var i = arr.length;
        while(i--){
            if( arr[i] 
                && arr[i].hasOwnProperty(attr) 
                && (arguments.length > 2 && arr[i][attr] === value ) ){ 

                arr.splice(i,1);
            }
        }
        return arr;
    }

    static notify(title, message) {
            return new Promise(resolve => {
                ipcRenderer.send('notify', {
                    title: title,
                    message: message
                })
            });
    }

    static openDevTools() {
        return new Promise(resolve => {
            ipcRenderer.send('dev-tools', {});
        });
    }

    static callAgent(command, args, callback) {
        return new Promise(resolve => {
            ipcRenderer.send(command, args)
        });
    }
}