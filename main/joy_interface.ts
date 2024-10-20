import * as g29 from 'logitech-g29'
import { usb, getDeviceList } from 'usb';
import { globalClient } from './background';

import { ResumableInterval } from './util_function';



const devices = getDeviceList();
var joyVer = {
    0xC24F: "PS3",
    0xC260: "PS4",
}
var joyConfig = {
    autocenter: true,
    range: 360,
}

var joyValue = {
    steerLeft: 0,
    steerRight: 0,
    padel: 0
}

var gear = 1

var sendIntervalControl = ResumableInterval(() => {
    if (globalClient && !globalClient.closed) {
        var speedData = JSON.stringify({
            left: Math.floor((joyValue.steerLeft * 255) * joyValue.padel * gear),
            right: Math.floor((joyValue.steerRight * 255) * joyValue.padel * gear),
        })
        console.log(speedData)
        globalClient.write(speedData)
        if (joyValue.padel == 0){
            sendIntervalControl.pause()
        }
    }
}
    , 100)
sendIntervalControl.start()
// console.log(devices)
devices.forEach(device => {
    var idProduct = device.deviceDescriptor.idProduct
    if (idProduct && idProduct === 0xC24F || idProduct === 0xC260) {
        console.log("Initial check Joy already connected", joyVer[idProduct])
        g29.connect(joyConfig, (err) => { })
    }
})
usb.on("attach", (device) => {
    var idProduct = device.deviceDescriptor.idProduct
    // G29 is 0xC24F for PS3 and 0xC260 for PS4
    if (idProduct && idProduct === 0xC24F || idProduct === 0xC260) {
        console.log("Joy Connected", joyVer[idProduct])
        g29.connect(joyConfig, (err) => { })
    }
})

usb.on("detach", (device) => {
    var idProduct = device.deviceDescriptor.idProduct
    // G29 is 0xC24F for PS3 and 0xC260 for PS4
    if (idProduct && idProduct === 0xC24F || idProduct === 0xC260) {
        console.log("Joy is disconnected")
    }
})

var count = 0
g29.on('pedals-gas', function (val) {
    // console.log("Gas", val)
    joyValue.padel = val
    sendIntervalControl.resume()

    // console.log(val)
})
g29.on('pedals-clutch', function (val) {
    console.log("Brake", val)
    // g.leds(val)
})
g29.on("wheel-turn", (value) => {

    joyValue.steerLeft = value / 100
    joyValue.steerRight = 1 - joyValue.steerLeft
    // joyValue.steerRight = (1-((value - 50) / 50)) - 1
    var ledVal = Math.abs(value / 100 - 0.5) * 2
    console.log(joyValue)
    g29.leds(ledVal)

})
g29.on("wheel-shift_left", (value) => {
    console.log(value)
    gear = -1
})
g29.on("wheel-shift_right", (value) => {
    console.log(value)
    gear = 1
})
g29.on("wheel-spinner", (value) => {
    if (value && value == 1) {
        count += 1
        console.log(`Spinner : ${count}`);
    }
    else if (value && value == -1) {
        count -= 1
        console.log(`Spinner : ${count}`);
    }
})
g29.on("wheel-button_spinner", (value) => {
    count = 0
    console.log(`Spinner : ${count}`);
    if (globalClient && !globalClient.closed){
        var camData = JSON.stringify({
            cam : "center"
        })
        
        globalClient.write(camData)
    }
})
g29.on("wheel-dpad", (value) => {
    var mapping = {
        // 0: "center",
        1: "cam-up",
        // 2: "up-right",
        3: "cam-right",
        // 4: "down-right",
        5: "cam-down",
        // 6: "down-left",
        7: "cam-left",
        // 8: "up-left",
    }
    if (mapping[value]){
        if (globalClient && !globalClient.closed){
            console.log(mapping[value])
            var camData = JSON.stringify({
                cam : mapping[value]
            })
            
            globalClient.write(camData)
        }
    }
})

export { g29 }