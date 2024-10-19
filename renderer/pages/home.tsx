
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import ControlButton from './control_btn'
import RoverConnection from './connect_btn'
import { Spinner } from '@nextui-org/spinner'
import { ColorRing, Grid } from 'react-loader-spinner'
import { ResumableInterval } from './util_function'

export default function HomePage() {
  var [status, setStatus] = useState(() => ShowConnectionStatus("disconnected"))
  var [connectBtnTxt, setConnectBtnTxt] = useState(() => "Connect Control")
  var [streamImage, setStreamImage] = useState(() => <div></div>)
  var [isScan, setIsScan] = useState(() => false)
  var [roverList, setRoverList] = useState(() => Object)


  var [requestIntervalControl, setRequestIntervalControl] = useState(() =>
    ResumableInterval(() => {
      window.ipc.send("getRover", true);
    }, 2000))

  const getRover = (gotList) => {
    setRoverList(gotList)
    console.log(roverList)
  }

  useEffect(() => {
    window.ipc.on("getStatus", (message: string) => {
      if (message.trim() === "connected") {
        setConnectBtnTxt("Disconnect Control")
      }
      if (message.trim() === "disconnected") {
        setConnectBtnTxt("Connect Control")
      }
      setStatus(ShowConnectionStatus(message))
    })

    window.ipc.on("getRover", getRover)

    window.ipc.on('connect', (message: string) => {
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



    return () => {

      window.ipc.send("getStatus", "get");
    }
  }, [])

  function ShowConnectionStatus(connectionText: string) {
    if (connectionText.trim() === "connected") {
      return (
        <div className='bg-[#009900] px-2 py-3 rounded-md my-2 text-center inline ml-1'>
          Connected
        </div>
      )
    }
    else if (connectionText.trim() === "disconnected") {

      return (
        <div className='bg-gray-500 px-2 py-3 rounded-md my-2 text-center inline ml-1'>
          Disconnected
        </div>
      )
    }

    // else if (connectionText.trim() === "connecting") {
    //   return (
    //     <div className='bg-gray-500 px-2 py-3 rounded-md my-2 text-center inline ml-1'>
    //       <Spinner/>
    //     </div>
    //   )
    // }
  }
  function onSelect(selected){
    console.log(`Selected ${JSON.stringify(selected)}`)
  }
  function RoverListDisplay() {
    var keys = Object.keys(roverList)

    var out = keys.map((key) => <button onClick={()=>onSelect({[key]:roverList[key]})} className='block rounded-md px-4 py-2 mb-3 mx-3 hover:bg-gray-400'>{key} : {roverList[key]}</button> )
    return <div className='w-10vw'>{out}</div>
  }

  function preloadImage() {
    const image = new Image()
    image.onload = () => {
      setStreamImage(<img src={image.src} />)
    }
    image.onerror = () => {
      setStreamImage(<div>Load Failed</div>)
    }
    image.src = "http://rover:712/stream.mjpg"
    setStreamImage(<Grid color='white' />)
  }

  function startScanRover() {
    console.log(isScan)
    setIsScan((prev) => !prev)
    if (isScan) {
      console.log("Stop Scan")
      requestIntervalControl.stop()
    }
    else {
      console.log("Start Scan")
      requestIntervalControl.start()
    }
  }


  return (
    <>
      <Head>
        <title>Mars Rover Control</title>
      </Head>
      <div className="block h-[100vh]">
        <header className="inline-block w-full">
          <h1 className="text-center text-2xl">
            Rover Camera Display
          </h1>
        </header>
        <div className=''>
          {streamImage}
          {/* <img className="bg-white text-gray-500 m-5 max-w-[1366px] inline-block" src="http://rover:7123/stream.mjpg"/> */}
          {/* {preloadImage("http://rover:7123/stream.mjpg").then((value)=>{return <>{value}</>}).catch((err)=>{return <>{err}</>})} */}
          <span className="inline-block">
            <span className='mt-4'>
              Status :
              {status}
            </span>
            <span className='block'>
              {/* <RoverConnection btnTxt={connectBtnTxt} /> */}
              {/* <button className='inline-block bg-blue-600 mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-blue-400' onClick={preloadImage}>Connect Video</button> */}
              <button className='inline-block bg-blue-600 mx-2 px-4 py-2 rounded-md active:border-white border-4 border-hidden hover:bg-blue-400' onClick={startScanRover}>Scan Rover</button>
              {isScan ? <ColorRing wrapperClass='inline padding-0' width={50} /> : <></>}
              <ControlButton />
              <RoverListDisplay/>
            </span>
          </span>
        </div>
      </div>
    </>
  )
}
