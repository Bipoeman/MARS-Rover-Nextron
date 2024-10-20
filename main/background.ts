import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { mdns, foundDevice, discoverRover } from "./device_scanner"
import { g29 } from './joy_interface'
import { keypressToSpeed } from './util_function'

import * as net from "net";
import { Socket } from 'net'

var connected = false;
export var globalClient : Socket

var keypressed = {
  'W': 0,
  'A': 0,
  'S': 0,
  'D': 0
}
var last_keypressed = {}

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

; (async () => {
  await app.whenReady();
  mdns
  g29
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    icon: `./resources/icon.png`,
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
  if (globalClient){
    console.log(`Connecting : ${globalClient.connecting} Closed : ${globalClient.closed}`)
  }
  if (globalClient && !connection){
    globalClient.end()
  }
  if (!connected) {
    // event.reply("connect","connecting")
    var client : Socket = await net.connect(connection.port, connection.host, function () {
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
      // globalClient.end();
      client.end()
      connected = false;
      console.log('disconnected from server');
    });
  }
  else {
    globalClient.end()
  }

})

ipcMain.on("getStatus", (event, data) => {
  if (connected) {
    event.reply("getStatus", "connected")
  }
  else {
    event.reply("getStatus", "disconnected")

  }
})

ipcMain.on("keyboard", (event, key) => {
  // console.log(key)
  if ((key['key'] === "W" || key['key'] === "A" || key['key'] === "S" || key['key'] === "D")) {
    keypressed[key['key']] = key['state']
    if (JSON.stringify(keypressed) != JSON.stringify(last_keypressed)) {
      console.log("Sending Speed")
      var speed = keypressToSpeed(keypressed)
      if (connected) {
        console.log(speed)
        globalClient.write(JSON.stringify(speed))
      }

      console.log(speed)
      last_keypressed = { ...keypressed }
    }
  }
  else if (!(key['key'] == "W" || key['key'] == "A" || key['key'] == "S" || key['key'] == "D")) {
    console.log(`Sending normal key ${JSON.stringify(key)}`)
    // console.log(key)
    if (connected) {
      globalClient.write(JSON.stringify(key))
    }
  }
  // if (net.connected)
})

ipcMain.on("getRover", (event, enable: boolean) => {
  discoverRover((foundDevice) => {
    console.log("Reply")
    event.reply("getRover", foundDevice)
  })
})