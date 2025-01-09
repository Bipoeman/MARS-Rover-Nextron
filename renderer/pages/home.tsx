
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

  var [status, setStatus] = useState(() => ShowConnectionStatus("disconnected"))
  var [connectBtnTxt, setConnectBtnTxt] = useState(() => "Connect Control")
  var [streamImage, setStreamImage] = useState(() => <></>)
  var [isScan, setIsScan] = useState(() => false)
  var [roverList, setRoverList] = useState(() => Object)
  var [selectedRover, setSelectedRover] = useState(() => "")
  var [interfaceSelections, setInterfaceSelections] = useState<NodeJS.Dict<os.NetworkInterfaceInfo[]>>()
  var [isConnected, setIsConnected] = useState(false)
  var [takePictureStatus, setTakePictureStatus] = useState(<></>)
  var [takePictureStatusOpacity, setTakePictureStatusOpacity] = useState(0)
  var [selectedInterface, setSelectedInterface] = useState("Ethernet")
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
    })
    window.ipc.on("interface", (interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>) => {
      console.log(JSON.stringify(Object.keys(interfaces)))
      setInterfaceSelections(prev => interfaces)
    })

    window.ipc.on("take_picture", (response) => {
      // console.log(`Display ${response['message']}`)
      setTakePictureStatus(<>{response['message']}</>)
      setTakePictureStatusOpacity(100);
      setTimeout(() => {
        // console.log(`No Display ${response['message']}`)
        // setTakePictureStatus(<></>)
        setTakePictureStatusOpacity(0);
      }, 1200)
    })

    window.ipc.on("getRover", getRover)

    window.ipc.on('connect', (message: string) => {
      setIsConnected(prev => message.trim() === "connected")
      console.log(`status : ${message}`)
      if (message.trim() === "connected") {
        preloadImage(`http://${selectedRover}:7123/stream.mjpg`)
        setConnectBtnTxt("Disconnect Control")
      }
      if (message.trim() === "disconnected") {
        // window.ipc.send("connect",{})
        setConnectBtnTxt("Connect Control")
      }
      if (message.trim() === "connecting") {
        setConnectBtnTxt("Connecting Control")
      }
      setStatus(ShowConnectionStatus(message))
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

  function ShowConnectionStatus(connectionText: string) {
    if (connectionText.trim() === "connected") {
      return (<>Connected</>
        // <div className='bg-[#009900] px-2 py-3 rounded-md my-2 text-center inline ml-1'>
        /* </div> */
      )
    }
    else if (connectionText.trim() === "disconnected") {

      return (<>Disconnected</>
        // <div className='bg-gray-500 px-2 py-3 rounded-md my-2 text-center inline ml-1'>
        /* </div> */
      )
    }

  }
  function onSelect(selected: string) {
    console.log(`Selected ${selected}`)
    var ip = selected
    setSelectedRover((prev) => selected)
    preloadImage(`http://${selected}:7123/stream.mjpg`)
    var connection = {
      "host": `${selected}`,
      "port": 8000
    }
    // if (!isConnected) {
    window.ipc.send("connect", connection)
    // }
  }

  function onDisconnnect() {
    window.ipc.send("connect", null)
    setStreamImage(<span></span>)
    setSelectedRover(prev=>"")
  }

  function preloadImage(imgSrc: string) {
    const image = new Image()
    console.log(imgSrc)
    image.onload = () => {
      setStreamImage(<img className="inline" src={image.src} />)
      setLoadImageFailedCount(prev => 0)
      if (isScan) {
        setIsScan(prev => false)
        console.log("Stop Scan")
        requestIntervalControl.stop()
        setRoverList(prev => Object)
      }
    }
    image.onerror = () => {
      setStreamImage(<span>Load Failed</span>)
      console.log("Stream Load Error",selectedRover)
      setTimeout(() => (setLoadImageFailedCount(prev => {
        if (prev < maxGetImageAttempt) {
          preloadImage(imgSrc)
        }
        return prev + 1
      })), 200)

    }
    // image.src = "http://rover:712/stream.mjpg"
    image.src = imgSrc
    setStreamImage(<Grid color='white' />)
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
            <img src={`http://${selectedRover}:7123/stream.mjpg`}/>
          </span> : <></>}
          <span className="align-middle">
            <span className='inline-flex flex-col justify-start'>
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
              {isConnected ? <span className='inline-flex flex-col'>
                <button className='inline bg-[#e1662d] mx-2 mt-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:hover:bg-[#c1653a]'
                  onClick={takePicture}>
                  Take Picture 📷
                </button>
                {takePictureStatusOpacity == 100 ? <div className={`bg-[#e35296] px-2 py-3 mt-2 rounded-md inline opacity-${takePictureStatusOpacity} transition-opacity ease-out duration-[${takePictureStatusOpacity == 100 ? 100 : 1000}]`}>
                  {takePictureStatus}
                </div> : <></>}
              </span> : <></>}
            </span>
          </span>
          <ControlButton />
        </span>
      </div>
    </>
  )
}
