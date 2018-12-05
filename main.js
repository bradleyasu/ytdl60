const electron = require('electron')
const notifier = require('node-notifier')
const path = require('path')
const Growl = require('node-notifier').Growl
const {ipcMain} = require('electron');
const spawn = require('child_process').spawn;


// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow




// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      width: 1000, height: 700,
      backgroundColor: '#fefefe',
      frame: true, // change to false for chromeless window

  })

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  mainWindow.setMenu(null);
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
    handleCommand();
  }
})


ipcMain.on('cli', (event, argument) => {

  execute(argument.command, argument.args, (output) => {
    event.sender.send('cliOutput', output);
  });
  event.returnValue = "done";
});

ipcMain.on('ytdl', (event, argument) => {

  ytdlexecute(argument.command, argument.args, (output) => {
    event.sender.send(argument.hash, argument.handle, output);
  });
  event.returnValue = "done";
});

ipcMain.on("dev-tools", (event, argument) => {
  mainWindow.webContents.openDevTools();
});

ipcMain.on('notify', (event, argument) => {
  notify(argument.title, argument.message);
});

function ytdlexecute(command, args, callback) {
  //callback("CLI-START");
  cmd = spawn(command, args);

  cmd.stdout.on('data', function (data) {
    callback(data.toString());
  });
  
  cmd.stderr.on('data', function (data) {
    callback(data.toString());
  });
  
  cmd.on('exit', function (code) {
    callback("YTDL-DONE");
  });

}

function execute(command, args, callback) {
  callback("CLI-START");
  cmd = spawn(command, args);

  cmd.stdout.on('data', function (data) {
    callback(data.toString());
  });
  
  cmd.stderr.on('data', function (data) {
    callback(data.toString());
  });
  
  cmd.on('exit', function (code) {
    callback("CLI-DONE");
  });
};


function notify(title, message) {
  notifier.notify({
      title: title,
      message: message,
      sound: true
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//  notifier.notify(
  //  {
    //  title: 'Download is complete',
    //  message: 'Testing Download Complete',
    //  icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
    //  sound: true, // Only Notification Center or Windows Toasters
  //   wait: true // Wait with callback, until user action is taken against notification
//   },
  //  function(err, response) {
    //  Response is response from notification
  //  }
// );
