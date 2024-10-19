import mdnss from "multicast-dns"

import os from 'os';
import { ResumableInterval } from "./util_function";


console.clear()
var networkInterfaces = os.networkInterfaces();
// console.log(networkInterfaces)
var ipaddr = []
var macs = []
var interfaces = networkInterfaces['Ethernet 5']
console.log(interfaces)
interfaces && interfaces.forEach((ip) => {
  if (ip.family == "IPv4") {
    ipaddr.push(ip.address)
    macs.push(ip.mac)
  };
})
var mdns = mdnss(
  {
    multicast: true, // use udp multicasting
    interface: ipaddr[0], // explicitly specify a network interface. defaults to all
    port: 5353, // set the udp port
    ip: '224.0.0.251', // set the udp ip
    ttl: 255, // set the multicast ttl
    loopback: true, // receive your own packets
    reuseAddr: true // set the reuseAddr option when creating the socket (requires node >=0.11.13)
  }
)

var foundDevice = {}

var intervalControl = ResumableInterval(() => {
    console.log("Query")
    mdns.query({
        questions: [{
            name: 'jellyfish.local',
            type: 'A',
            class: "IN"
        }]
    })
    foundDevice = {}

}, 2000)
intervalControl.start()

mdns.on('response', function (response) {
    if (response.answers[0] && response.answers[0].name.includes("jellyfish.local")) {
        var ip = response.answers[0]['data']
        var name = response.answers[1]['data']['target']
        foundDevice[name] = ip
        console.log(foundDevice)
    }
})


mdns.on('query', function (query) { })

export { intervalControl, mdns, foundDevice}

