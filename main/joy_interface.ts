import * as g29 from 'logitech-g29'
import { usb, getDeviceList } from 'usb';

const devices = getDeviceList();
var joyVer = {
    0xC24F: "PS3",
    0xC260: "PS4",
}
var joyConfig = {
    autocenter: true,
    range: 900,
}
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
    console.log("Gas", val)
    // console.log(val)
})
g29.on('pedals-clutch', function (val) {
    console.log("Brake", val)
    // g.leds(val)
})
g29.on("wheel-turn", (value) => {
    var ledVal = Math.abs(value / 100 - 0.5) * 2
    // console.log(ledVal)
    g29.leds(ledVal)

})
g29.on("wheel-shift_left", (value) => {
    console.log(value)
})
g29.on("wheel-shift_right", (value) => {
    console.log(value)
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
})
g29.on("wheel-dpad", (value) => {
    var mapping = {
        0: "center",
        1: "up",
        2: "up-right",
        3: "right",
        4: "down-right",
        5: "down",
        6: "down-left",
        7: "left",
        8: "up-left",
    }
    console.log(mapping[value])
})

export {g29}