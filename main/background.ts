import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { mdns, foundDevice, discoverRover, setMdns } from "./device_scanner"
import { g29, sendIntervalControl, setGear } from './joy_interface'
import { keypressToSpeed } from './util_function'
import os from "os"
import mdnss from "multicast-dns"

import * as net from "net";
import { Socket } from 'net'

var connected = false;
export var globalClient: Socket

var globalConnection = {}
var globalImageEvent
export var globalWindow: Electron.CrossProcessExports.BrowserWindow

interface imagePy {
  file_path: string,
  message: string,

}

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
    // frame: false,
    // simpleFullscreen:true,
    autoHideMenuBar: true,
    kiosk: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // devTools: false,
    },
  })
  // mainWindow.removeMenu()

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    // mainWindow.webContents.openDevTools()
  }
  globalWindow = mainWindow;
})()

app.on('window-all-closed', () => {
  globalWindow = null
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.on("gear-shift",(event,arg : number)=>{
  setGear(arg)
})

ipcMain.on("interface", (event, input: string) => {
  var networkInterfaces = os.networkInterfaces();
  // console.log(networkInterfaces)
  if (input === "ask") {
    event.reply("interface", networkInterfaces)
  }
  else {
    var interfaces = networkInterfaces[input]
    interfaces && interfaces.forEach((ip) => {
      if (ip.family == "IPv4") {
        var temp = mdnss(
          {
            multicast: true, // use udp multicasting
            interface: ip.address, // explicitly specify a network interface. defaults to all
            port: 5353, // set the udp port
            ip: '224.0.0.251', // set the udp ip
            ttl: 255, // set the multicast ttl
            loopback: true, // receive your own packets
            reuseAddr: true // set the reuseAddr option when creating the socket (requires node >=0.11.13)
          }
        )
        console.log(ip.address)
        setMdns(temp);
      };
    })

  }
})



var disconnectFromCommand = false;
ipcMain.on("connect", async (event, connection) => {
  var attemptConnectCount = 0;
  var maxAttempt = 30
  async function attemptConnect() {
    if (attemptConnectCount < maxAttempt) {
      attemptConnectCount += 1
      var client: Socket = await net.connect(connection.port, connection.host, function () {
        event.reply("connect", "connected")
        connected = true;
        console.log('connected to server!');
        // client.write("Hello")
        attemptConnectCount = 0;
        globalConnection = { ...connection }
      });
      globalClient = client


      client.on('data', function (data) {
        console.log(data.toString());
        // client.end();
      });

      client.on('end', function () {
        sendIntervalControl.pause()
        event.reply("connect", "disconnected")
        globalClient = null;
        client.end()
        connected = false;
        console.log('disconnected from server');
        console.log(`Connection Check : ${JSON.stringify(connection)}`)
        if (connection && !disconnectFromCommand) {
          console.log(`Disconnected for some reason, tring to reconnect ${attemptConnectCount}`)
          attemptConnect();
        }
        else {
          disconnectFromCommand = false;
        }
      });

      client.on("error", (err: Error) => {
        if (globalClient) {
          sendIntervalControl.pause()
          globalClient.end();
          connected = false;
          globalClient = null;
        }
        console.log(`Error tring to reconnect  ${attemptConnectCount}`)
        attemptConnect();

      })
    }
  }

  console.log(`Connection ${JSON.stringify(connection)}`)
  if (globalClient) {
    console.log(`Connecting : ${globalClient.connecting} Closed : ${globalClient.closed}`)
  }
  if (globalClient && !connection) {

    globalClient.end()

  }
  if (!connected) {
    // event.reply("connect","connecting")
    if (connection) {
      attemptConnect();
    }
  }
  else {
    globalClient.end()
    disconnectFromCommand = true;
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

var stateP;



ipcMain.on("keyboard", async (event, key) => {
  console.log(key)
  if ((key['key'] === "W" || key['key'] === "A" || key['key'] === "S" || key['key'] === "D")) {
    keypressed[key['key']] = key['state']
    var speed = keypressToSpeed(keypressed)
    if (globalClient && connected) {
      console.log(speed)
      globalClient.write(JSON.stringify(speed))
    }
    if (JSON.stringify(keypressed) != JSON.stringify(last_keypressed)) {
      console.log("Sending Speed")

      console.log(speed)
      last_keypressed = { ...keypressed }
    }
  }
  else if (key['key'] == "P") {
    if (key['state'] != stateP) {
      if (key['state'] == 1) {
        if (globalClient && connected) {
          take_picture()
          // var returnStatus = await (await fetch(`http://${globalConnection['host']}:7123/takephoto`)).json()
          // console.log(returnStatus)
          // globalImageEvent.reply("take_picture", returnStatus)
        }
      }
      stateP = key['state']
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

ipcMain.on("take_picture", async (event, param: boolean) => {
  console.log("Take Picture")
  globalImageEvent = event;
  if (param != false) {
    take_picture()
  }
})

export async function take_picture() {
  var returnStatus = await (await fetch(`http://${globalConnection['host']}:7123/takephoto`, { method: "GET" })).json()
  console.log("Take Pic complete","Getting Pic",`http://${globalConnection['host']}:7123/latest_photo`)
  console.log(JSON.stringify(returnStatus))
  var image = await (await fetch(`http://${globalConnection['host']}:7123/latest_photo`, { method: "GET" })).blob()
  console.log("Get Pic complete", image)
  var imgUploadForm = new FormData()
  imgUploadForm.append("team", returnStatus.team)
  imgUploadForm.append("photos", image, "image.jpg")
  var uploadStatus = await (await fetch(`http://rover-server:3002/photos/upload`, { method: "POST", body: imgUploadForm })).json()
  console.log("Upload complete", JSON.stringify(uploadStatus))

  globalWindow.webContents.send("take_picture", uploadStatus)
}