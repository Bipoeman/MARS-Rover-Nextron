import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

var net = require('net')
var connected = false;
var globalClient: any

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
    if(JSON.stringify(keypressed) != JSON.stringify(last_keypressed)){
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
  else if (!(key['key'] == "W" || key['key'] == "A" || key['key'] == "S" || key['key'] == "D")){
    console.log(`Sending normal key ${JSON.stringify(key)}`)
    // console.log(key)
    if (connected) {
      globalClient.write(JSON.stringify(key))
    }
  }
  // if (net.connected)
})

function keypressToSpeed(keypressed){
  console.log(keypressed)
  let left,right
  if (keypressed['W'] === 0 && keypressed['S'] === 0) {
    if (keypressed['D'] === 1 && keypressed['A'] === 0) {
      left = 150;
      right = -150;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
      left = -150;
      right = 150;
    } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
      left = 0;
      right = 0;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
      left = 150;
      right = 150;
    }
  } else if (keypressed['W'] === 1 && keypressed['S'] === 0) {
    if (keypressed['D'] === 1 && keypressed['A'] === 0) {
      left = 255;
      right = 150;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
      left = 150;
      right = 255;
    } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
      left = 255;
      right = 255;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
      left = 255;
      right = 255;
    }
  } else if (keypressed['S'] === 0 && keypressed['W'] === 0) {
    if (keypressed['D'] === 1 && keypressed['A'] === 0) {
      left = -255;
      right = -150;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
      left = -150;
      right = -255;
    } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
      left = 0;
      right = 0;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
      left = -150;
      right = -150;
    }
  } else if (keypressed['S'] === 1 && keypressed['W'] === 0) {
    if (keypressed['D'] === 1 && keypressed['A'] === 0) {
      left = -255;
      right = -150;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
      left = -150;
      right = -255;
    } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
      left = -255;
      right = -255;
    } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
      left = -255;
      right = -255;
    }
  }
  return {
    "left":left,
    "right":right,
  }
}