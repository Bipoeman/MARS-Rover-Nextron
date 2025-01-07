import mdnss from "multicast-dns"

import os from 'os';
import { ResumableInterval } from "./util_function";


console.clear()
var networkInterfaces = os.networkInterfaces();
// console.log(networkInterfaces)
var ipaddr: string[] = []
var macs = []
var interfaces = networkInterfaces['Ethernet']
var respond = (response: Object) => { }
// console.log(interfaces)
interfaces && interfaces.forEach((ip) => {
  if (ip.family == "IPv4") {
    ipaddr.push(ip.address)
    macs.push(ip.mac)
    console.log(ipaddr)
  };
})

var mdns = mdnss()

export function setMdns(newConfig: mdnss.MulticastDNS) {
  mdns.destroy()
  mdns = newConfig;

  mdns.on('response', function (response) {
    console.log(response.answers)
    if (response.answers[0] && response.answers[0].name.includes("rover-car.local")) {
      console.log("Answers")
      // if (response.answers[0]['data']){
      var ip = response.answers[0]['data']
      var name = response.answers[1]['data']['target']
      foundDevice[name] = ip
      respond(foundDevice)
      console.log(foundDevice)
      // }
    }
  })


  mdns.on('query', function (query) {
    // console.log(query.answers)
  })
}

var foundDevice = {}
export function discoverRover(onFound: (response: Object) => void) {
  foundDevice = {}
  respond = onFound
  console.log("Query")
  mdns.query({
    questions: [{
      name: 'rover-car.local',
      type: 'A',
      class: "IN"
    }]
  })
}


export { mdns, foundDevice }

