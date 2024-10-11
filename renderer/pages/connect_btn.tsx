
export default function RoverConnection(props){
    var btnTxt = props.btnTxt
    function onConnect(){
        console.log("Connect")
        var connection = {
            "host" : "localhost",
            "port" : 65432
        }
        window.ipc.send("connect",connection)
        // ipcRenderer.invoke
        // invoke("connect")
    }
    return <>
    <button onClick={onConnect} className="mx-2 my-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500">{btnTxt}</button>
    </>
}