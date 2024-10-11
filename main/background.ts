import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

var net = require('net')
var connected = false;
var globalClient: any

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

; (async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.on("connect", async (event, connection) => {
  console.log(connection)
  console.log(net.disconnected)
  if (!connected) {
    // event.reply("connect","connecting")
    var client = await net.connect(8000, "rover.local", function () {
      event.reply("connect", "connected")
      connected = true;
      console.log('connected to server!');
      client.write("Hello")
    });
    globalClient = client

    client.on('data', function (data) {

      console.log(data.toString());
      client.end();
    });

    client.on('end', function () {
      event.reply("connect", "disconnected")
      globalClient.end();
      client.end()
      connected = false;
      console.log('disconnected from server');
    });
  }
  else{
    globalClient.end()
  }

})

ipcMain.on("getStatus",(event,data)=>{
  if (connected){
    event.reply("getStatus","connected")
  }
  else{
    event.reply("getStatus","disconnected")

  }
})

ipcMain.on("keyboard", (event, key) => {
  console.log(key)
  if (connected) {
    globalClient.write(JSON.stringify(key))
  }
  // if (net.connected)
})
