import Editor from "@monaco-editor/react"
import { useState, useRef, useEffect } from 'react'


export default function CodeEditor(){

    //creates new socketRef to a websocket with null path. similar to a file descriptor
    const socketRef = useRef<WebSocket | null>(null)
    
    const [code, setCode] = useState("//placeholder")
    const isRemoteUpdate = useRef(false)

    useEffect(() => {

    //sets the current reference to the socket as a new path of the localhost8080 socket
    socketRef.current = new WebSocket('ws://localhost:8080')

    //when a message is sent, that is the event
    socketRef.current.onmessage = async (event) => {
      //data from the event is displayed when event is noticed (new data is written)
      //Safari said all data is  "Blob" 
      const text = event.data instanceof Blob
      ? await event.data.text()
      : event.data
      isRemoteUpdate.current = true
      setCode(text)
    }

    return () => {
    //when component unmounts. cleanup
    socketRef.current?.close()

    }
    //[] only makes it run once. else it runs every render, opening new websocket connection every time
    //not what we want since we only want the websocket to be opened once
  }, [])


    //automatically starts on vs-dark theme, but can be toggled to light mode with button
    const [isDarkNow, setTheme] = useState("vs-dark")

    return (
        <div>
            {/* button click toggle between light and dark mode */}
            {/* if its on vs-dark, change to light on click, otherwise opposite. */}
            <button onClick = {() => setTheme(isDarkNow === "vs-dark" ? "light" : "vs-dark")}>ToggleTheme</button>
            <Editor
                height = "90vh"
                defaultLanguage = "javascript"
                defaultValue ="//placeholder"
                //sets theme to initialized vs-dark
                theme = {isDarkNow}
                value = {code}

                onChange = {(value) => {
                    if(isRemoteUpdate.current){
                        isRemoteUpdate.current = false
                        return
                    }
                    if(socketRef.current?.readyState === 1){
                        socketRef.current.send(value ?? "")
                    }
                    setCode(value ?? "")
                }
            }
            />
        </div>
    )
}