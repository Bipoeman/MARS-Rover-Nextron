import { useEffect, useState } from 'react';

export default function ControlButton() {
    var prevState = {}
    var nowState = {}
    const [pressState, setPressState] = useState(false)
    useEffect(() => {
        const keyDownHandler = (e: any) => {
            console.log(e.code.replace("Key",""))
            var key = {
                "key" : e.code.replace("Key",""),
                "state" : 1
            }
            window.ipc.send("keyboard",key)
        };
        const keyUpHandler = (e: any) => {
            console.log(e.code.replace("Key",""))
            var key = {
                "key" : e.code.replace("Key",""),
                "state" : 0
            }
            window.ipc.send("keyboard",key)

        };
        document.addEventListener("keypress", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler)
        // clean up
        return () => {
            document.removeEventListener("keypress", keyDownHandler);
            document.removeEventListener("keyup", keyUpHandler);
        };
    }, []);
    return (
        <div>
            <div className="bg-yellow-200 grid">
                <button id="fw" type="button" className="bg-blue-600 p-2 m-1 rounded-md hover:bg-blue-500">Forward ⬆</button>
                <button id="lf" type="button" className="bg-blue-600 p-2 m-1 rounded-md hover:bg-blue-500">⬅ Left</button>
                <button id="rt" type="button" className="bg-blue-600 p-2 m-1 rounded-md hover:bg-blue-500">Right ➡</button>
                <button id="bk" type="button" className="bg-blue-600 p-2 m-1 rounded-md hover:bg-blue-500">Backward ⬇</button>
            </div>
            {/* <div>
                <input type="range" min="1" max="100" value="50" id="myRange"></input>
            </div> */}
        </div>
    );
}