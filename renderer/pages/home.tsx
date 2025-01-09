
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import ControlButton from './control_btn'
import RoverConnection from './connect_btn'
import { Spinner } from '@nextui-org/spinner'

import { ColorRing, Grid, MagnifyingGlass, Radio } from 'react-loader-spinner'
import { ResumableInterval } from '../../main/util_function'
import { Dropdown } from 'react-bootstrap'
import { K2D } from 'next/font/google'
import os from "os"

const k2d = K2D({ weight: "400", subsets: ["latin"] })
var maxGetImageAttempt = 50;
export default function HomePage() {
  var [streamImage, setStreamImage] = useState(() => <></>)
  var [isScan, setIsScan] = useState(() => false)
  var [roverList, setRoverList] = useState(() => Object)
  var [selectedRover, setSelectedRover] = useState(() => "")
  var [interfaceSelections, setInterfaceSelections] = useState<NodeJS.Dict<os.NetworkInterfaceInfo[]>>()
  var [isConnected, setIsConnected] = useState(false)
  var [takePictureStatus, setTakePictureStatus] = useState("")
  var [takePictureStatusOpacity, setTakePictureStatusOpacity] = useState(0)
  var [selectedInterface, setSelectedInterface] = useState("Select Network Interface")
  var [loadImageFailedCount, setLoadImageFailedCount] = useState(0)

  var [requestIntervalControl, setRequestIntervalControl] = useState(() =>
    ResumableInterval(() => {
      console.log("request")
      window.ipc.send("getRover", true);
    }, 2000)
  )



  useEffect(() => {
    window.ipc.send("take_picture", false)
    onDisconnnect()
    window.ipc.on("getStatus", (message: string) => {
      setIsConnected(prev => message.trim() === "connected")
      if (isConnected) {
        console.log("Stop Scan")
        requestIntervalControl.stop()
        setRoverList(prev => Object)
        setIsScan(prev => false)
      }
    })
    window.ipc.on("interface", (interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>) => {
      console.log(JSON.stringify(Object.keys(interfaces)))
      setInterfaceSelections(prev => interfaces)
    })

    window.ipc.on("take_picture", (response) => {
      console.log(`Display ${response['message']}`)
      setTakePictureStatus(prev => response['message'])
      setTakePictureStatusOpacity(100);
      setTimeout(() => {
        // console.log(`No Display ${response['message']}`)
        // setTakePictureStatus(<></>)
        setTakePictureStatusOpacity(0);
      }, 2000)
    })

    window.ipc.on("getRover", getRover)

    window.ipc.on('connect', (message: string) => {
      setIsConnected(prev => message.trim() === "connected")
      if (isConnected) {
        console.log("Stop Scan")
        requestIntervalControl.stop()
        setRoverList(prev => Object)
        setIsScan(prev => false)
      }
    })
    window.ipc.send("getStatus", "get");
    return () => { }
  }, [])

  function getInterfaces() {
    if (interfaceSelections) {
      setInterfaceSelections((prev) => null)
    }
    else {
      window.ipc.send("interface", "ask")
    }
  }

  function selectInterface(selected: string) {
    setSelectedInterface((prev) => selected)
    setInterfaceSelections((prev) => null)
    setRoverList(prev => Object)
    window.ipc.send("interface", selected)
  }

  function onSelect(selected: string) {
    console.log(`Selected ${selected}`)
    var ip = selected
    setSelectedRover((prev) => selected)
    var connection = {
      "host": `${selected}`,
      "port": 8000
    }
    window.ipc.send("connect", connection)
    console.log("Stop Scan")
    requestIntervalControl.stop()
    setRoverList(prev => Object)
    setIsScan(prev => false)
  }

  function onDisconnnect() {
    window.ipc.send("connect", null)
    setStreamImage(<span></span>)
    setSelectedRover(prev => "")
  }

  const getRover = (gotList) => {
    console.log(`Raw get : ${JSON.stringify(gotList)}`)
    setRoverList(prev => gotList)
    console.log(JSON.stringify(roverList))
  }

  function startScanRover() {
    console.log(isScan)
    setIsScan(prev => !prev)
    if (isScan) {
      console.log("Stop Scan")
      requestIntervalControl.stop()
      setRoverList(prev => Object)
    }
    else {
      console.log("Start Scan")
      requestIntervalControl.start()
    }
  }
  function takePicture() {
    window.ipc.send("take_picture", null)
  }


  return (
    <>
      <Head>
        <title>Mars Rover Control</title>
      </Head>
      <div className='bg-[#07141d] text-[#fbf2d0] h-screen'>
        <span className={` flex flex-row justify-between flex-wrap ${k2d.className}`}>
          {/* {streamImage} */}
          {selectedRover.length > 0 ? <span className='inline-block'>
            <img src={`http://${selectedRover}:7123/stream.mjpg`} loading='eager' />
          </span> : <></>}
          <span className='align-middle inline-flex flex-col justify-center'>
            <button className='inline bg-[#e1662d] mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-[#c1653a]' onClick={startScanRover}>
              {`Scan Rover`}
              {isScan && Object.keys(roverList).length == 0 ? <Radio height={30} width={40} wrapperClass='inline-block padding-0 margin-0' colors={["#fbf2d0", "#fbf2d0", "#fbf2d0"]} /> : <></>}
              {/* {isScan && Object.keys(roverList).length == 0 ? <ColorRing wrapperClass='inline-block padding-0 margin-0' width={30} height={30} /> : <></>} */}
            </button>
            {isScan && Object.keys(roverList).length > 0 ? <span className='bg-[#EEEEEE] border-solid border-2 flex flex-col  rounded-t-sm rounded-b-md m-2 p-1'>
              {Object.keys(roverList).map((value, index) =>
                <button
                  key={`${value}-${index}`}
                  className={`flex justify-start text-[#111111] text-bold ${k2d.className} p-2 hover:bg-[#c9c9c9] rounded-md`}
                  onClick={() => { onSelect(roverList[value]) }} >
                  {value} : {roverList[value]}
                </button >
              )}
            </span> : <></>}
            {isConnected ? <> <button onClick={onDisconnnect} className="mx-2 mt-2 px-3 py-2 rounded-md bg-[#CC2222] hover:hover:bg-[#c1653a]">
              Disconnect
            </button></> : <></>}
            <button onClick={getInterfaces} className='inline bg-[#e1662d] mx-2 mt-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-[#c1653a]'>
              {selectedInterface.length == 0 ? "Select Interface" : selectedInterface}
            </button>
            {interfaceSelections ?
              <span className='bg-[#EEEEEE] border-solid border-2 flex flex-col  rounded-t-sm rounded-b-md m-2 p-1'>
                {Object.keys(interfaceSelections).map((value, index) =>
                  <button
                    key={`${value}-${index}`}
                    className={`flex justify-start text-[#111111] text-bold ${k2d.className} p-2 hover:bg-[#c9c9c9] rounded-md`}
                    onClick={() => { selectInterface(value); }} >
                    {value}
                  </button >
                )}
              </span> : <></>}
            {isConnected ? <span className='inline-flex flex-col px-2'>
              <button className='inline bg-[#e1662d] mt-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:hover:bg-[#c1653a]'
                onClick={takePicture}>
                Take Picture 📷
              </button>
              {takePictureStatusOpacity == 100 ? <span className={`bg-[#e35296] max-w-[10vw] text-wrap inline-flex flex-wrap  px-2 py-3 mt-2 rounded-md opacity-${takePictureStatusOpacity} transition-opacity ease-out duration-[${takePictureStatusOpacity == 100 ? 100 : 1000}]`}>
                {takePictureStatus}
              </span> : <></>}
            </span> : <></>}
          </span>
          <ControlButton />
        </span>
      </div>
    </>
  )
}
