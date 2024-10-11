
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import ControlButton from './control_btn'
import RoverConnection from './connect_btn'
import { Spinner } from '@nextui-org/spinner'

export default function HomePage() {
  var [status, setStatus] = useState(ShowConnectionStatus("disconnected"))
  var [connectBtnTxt, setConnectBtnTxt] = useState("Connect")

  useEffect(() => {
    window.ipc.send("getStatus", "get");
    window.ipc.on("getStatus", (message: string) => {
      if (message.trim() === "connected") {
        setConnectBtnTxt("Disconnect")
      }
      if (message.trim() === "disconnected") {
        setConnectBtnTxt("Connect")
      }
      setStatus(ShowConnectionStatus(message))
    })
    window.ipc.on('connect', (message: string) => {
      console.log(`status : ${message}`)
      if (message.trim() === "connected") {
        setConnectBtnTxt("Disconnect")
      }
      if (message.trim() === "disconnected") {
        // window.ipc.send("connect",{})
        setConnectBtnTxt("Connect")
      }
      if (message.trim() === "connecting") {
        setConnectBtnTxt("Connecting")
      }
      setStatus(ShowConnectionStatus(message))
    })
  })

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

  return (
    <div className="block h-[100vh]">
      <header className="inline-block w-full">
        <h1 className="text-center text-2xl">
          Rover Camera Display
        </h1>
      </header>
      <div className=''>
        <img className="bg-white text-gray-500 m-5 max-w-[1366px] inline-block" src="http://rover:7123/stream.mjpg" />
        <span className="inline-block">
          <span className='mt-4'>
            Status :
            {status}
          </span>
          <span className='block'>
            <RoverConnection btnTxt={connectBtnTxt} />
            <ControlButton />
          </span>
        </span>
      </div>
    </div>
  )
}
