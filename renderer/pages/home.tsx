
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import ControlButton from './control_btn'
import RoverConnection from './connect_btn'
import { Spinner } from '@nextui-org/spinner'
import { ColorRing, Grid } from 'react-loader-spinner'
import { ResumableInterval } from '../../main/util_function'
import { Dropdown } from 'react-bootstrap'
import os from "os"
export default function HomePage() {
  var [status, setStatus] = useState(() => ShowConnectionStatus("disconnected"))
  var [connectBtnTxt, setConnectBtnTxt] = useState(() => "Connect Control")
  var [streamImage, setStreamImage] = useState(() => <></>)
  var [isScan, setIsScan] = useState(() => false)
  var [roverList, setRoverList] = useState(() => Object)
  var [interfaceSelections, setInterfaceSelections] = useState<NodeJS.Dict<os.NetworkInterfaceInfo[]>>()
  var [isConnected, setIsConnected] = useState(false)
  var [takePictureStatus, setTakePictureStatus] = useState(<></>)
  var [takePictureStatusOpacity, setTakePictureStatusOpacity] = useState(0)

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
    console.log("Request interfaces")
    window.ipc.send("interface", "ask")
  }

  function ShowConnectionStatus(connectionText: string) {
    if (connectionText.trim() === "connected") {
      return (
        // <div className='bg-[#009900] px-2 py-3 rounded-md my-2 text-center inline ml-1'>
        /* </div> */
        <>
          Connected
        </>
      )
    }
    else if (connectionText.trim() === "disconnected") {

      return (
        <>
          Disconnected
        </>
        // <div className='bg-gray-500 px-2 py-3 rounded-md my-2 text-center inline ml-1'>
        /* </div> */
      )
    }

  }
  function onSelect(selected) {
    console.log(`Selected ${JSON.stringify(selected)}`)
    var ip = Object.values(selected)[0]
    preloadImage(`http://${ip}:7123/stream.mjpg`)
    var connection = {
      "host": `${ip}`,
      "port": 8000
    }
    window.ipc.send("connect", connection)
  }

  function onDisconnnect() {
    window.ipc.send("connect", null)
    setStreamImage(<span></span>)
  }

  function RoverListDisplay() {
    var keys = Object.keys(roverList)

    var out = keys.map((key) =>
      <button onClick={() =>
        onSelect({ [key]: roverList[key] })}
        className='block rounded-md px-4 py-2 mb-3 mx-3 hover:bg-gray-400' key={key}>
        {key} : {roverList[key]}
      </button>)
    return <span className='w-10vw inline'>{out}</span>
  }


  function preloadImage(src: string) {
    const image = new Image()
    image.onload = () => {
      setStreamImage(<img className="inline" src={image.src} />)
      startScanRover()
    }
    image.onerror = () => {
      setStreamImage(<span>Load Failed</span>)
    }
    // image.src = "http://rover:712/stream.mjpg"
    image.src = src
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
      {/* <div className="block h-[100vh]"> */}
      {/* <header className="inline-block w-full">
          <h1 className="text-center text-2xl">
            Rover Camera Display
          </h1>
        </header> */}
      <span className=''>
        {streamImage}
        {/* {preloadImage("http://rover:7123/stream.mjpg").then((value)=>{return <>{value}</>}).catch((err)=>{return <>{err}</>})} */}
        <span className="inline-block align-middle">
          {/* <span className='mt-4'>
            Status : {status}
          </span> */}
          <span className='inline'>
            {/* <RoverConnection btnTxt={connectBtnTxt} /> */}
            {/* <button className='inline-block bg-blue-600 mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-blue-400' onClick={preloadImage}>Connect Video</button> */}


            <button className='inline bg-blue-600 mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-blue-400' onClick={startScanRover}>Scan Rover</button>
            {isScan ? <ColorRing wrapperClass='inline padding-0 margin-0' width={50} /> : <></>}
            <RoverListDisplay />

            {isConnected ? <> <button onClick={onDisconnnect} className="mx-2 my-2 px-3 py-2 rounded-md bg-[#CC2222] hover:bg-blue-500">Disconnect</button> <br /></> : <></>}

            <ControlButton />

            {isConnected ? <><button className='inline bg-blue-600 mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-blue-400' onClick={takePicture}>Take Picture 📷</button><br /> </> : <></>}
            <br />
            <div className={`inline opacity-${takePictureStatusOpacity} transition-opacity ease-out duration-[${takePictureStatusOpacity == 100 ? 100 : 1000}]`}>{takePictureStatus}</div>
            <br />

            {/* <Dropdown className='inline bg-blue-600 mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-blue-700'>
              <Dropdown.Toggle variant="success" id="dropdown-basic" onClick={getInterfaces}>
                Select Interface
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>Item 1</Dropdown.Item>
                <Dropdown.Item>Item 2</Dropdown.Item>
                {
                  interfaceSelections ? Object.keys(interfaceSelections).map((value, index) =>
                    <Dropdown.Item key={`${value}-${index}`}>{value}</Dropdown.Item>
                  ) : <></>}
              </Dropdown.Menu>
            </Dropdown> */}
          </span>
        </span>
      </span>
      {/* </div> */}
    </>
  )
}
