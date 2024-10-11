import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import ControlButton from './control_btn'
import RoverConnection from './connect_btn'

export default function HomePage() {
  var [status, setStatus] = React.useState(
    <div className='bg-gray-500 px-2 py-3 rounded-md my-2 text-center'>
      Not Connected
    </div>
  )
  useEffect(() => {
    window.ipc.on('connect', (message: string) => {
      if (message.match("connected")) {
        setStatus(
          <div className='bg-green-500 px-2 py-3 rounded-md my-2 text-center'>
            Connected
          </div>
        )
      }
    })
  })
  return (
    <div className="bg-blue-300 block h-[100vh]">
      <header className="inline-block w-full">
        <h1 className="text-center text-2xl">
          Rover Camera Display
        </h1>
      </header>
      <div className="bg-yellow-500 flex">
        <div className="bg-white text-gray-500 m-5">
          <img src="http://rover:7123/stream.mjpg" />
        </div>
        <div className="bg-green-500 absolute right-0 w-[15vw]">
          <h1 className="text-white text-center">
            Control Parameter
          </h1>
          {status}
          <ul>
            <li>Padel :</li>
            <li>Brake :</li>
            <li>Steer :</li>
          </ul>
          <ControlButton />
          <RoverConnection />
        </div>
      </div>
    </div>
  )
}
