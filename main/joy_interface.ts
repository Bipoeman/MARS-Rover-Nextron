import * as g29 from 'logitech-g29'
import { usb, getDeviceList } from 'usb';
import { globalClient } from './background';

import { ResumableInterval } from './util_function';

var steerMode = 1 // either mode 0 or 1

const devices = getDeviceList();
var joyVer = {
    0xC24F: "PS3",
    0xC260: "PS4",
}
var joyConfig = {
    autocenter: true,
    range: steerMode == 0 ? 360 : 900,
}

var joyValue = {
    steerLeft: 0,
    steerRight: 0,
    padel: 0,
    brake: 0
}

var gear = 1

var sendIntervalControl = ResumableInterval(() => {
    if (globalClient && !globalClient.closed) {
        var padelOut = joyValue.padel - joyValue.brake;
        if (padelOut < 0) {
            padelOut = 0
        }
        if (steerMode === 0) {
            /**
             * Full speed reduce speed to steer
             */
            var left = ((1 - joyValue.steerRight) * 255) * joyValue.padel * gear
            var right = ((1 - joyValue.steerLeft) * 255) * joyValue.padel * gear
        }
        else if (steerMode === 1) {
            /**
             * rotate to steer
             */
            var left = (2 * (0.5 - joyValue.steerRight) * 255) * padelOut * gear
            var right = (2 * (0.5 - joyValue.steerLeft) * 255) * padelOut * gear

        }

        var speedData = JSON.stringify({
            left: Math.floor(left),
            right: Math.floor(right),
        })
        console.log(speedData)
        globalClient.write(speedData)
        if (padelOut == 0) {
            sendIntervalControl.pause()
        }
    }
}
    , 100)
sendIntervalControl.start()
// console.log(devices)
devices.forEach(device => {
    var idProduct = device.deviceDescriptor.idProduct
    try {
        g29.connect(joyConfig, (err) => { })

    }
    catch {

    }
    if (idProduct && idProduct === 0xC24F || idProduct === 0xC260) {
        console.log("Initial check Joy already connected", joyVer[idProduct])
        // g29.connect(joyConfig, (err) => { })
    }
})
usb.on("attach", (device) => {
    console.log("Attached", device.deviceDescriptor.idProduct, 0xC24F)
    var idProduct = device.deviceDescriptor.idProduct
    // G29 is 0xC24F for PS3 and 0xC260 for PS4
    g29.connect(joyConfig, (err) => { })
    if (idProduct && idProduct === 0xC24F || idProduct === 0xC260) {
        console.log("Joy Connected", joyVer[idProduct])
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
g29.on('pedals-brake', function (val) {
    // console.log("Brake", val)
    joyValue.brake = val
    sendIntervalControl.resume()

    // g.leds(val)
})
g29.on("wheel-turn", (value) => {

    joyValue.steerLeft = (value - 50) / 50
    joyValue.steerRight = (50 - value) / 50
    if (joyValue.steerLeft < 0) {
        joyValue.steerLeft = 0
    }
    if (joyValue.steerRight < 0) {
        joyValue.steerRight = 0
    }
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
    if (globalClient && !globalClient.closed) {
        var camData = JSON.stringify({
            cam: "center"
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
    if (mapping[value]) {
        if (globalClient && !globalClient.closed) {
            console.log(mapping[value])
            var camData = JSON.stringify({
                cam: mapping[value]
            })

            globalClient.write(camData)
        }
    }
})

export { g29 }