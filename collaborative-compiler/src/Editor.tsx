import Editor from "@monaco-editor/react"
import { useState, useRef, useEffect } from 'react'
import type { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'


export default function CodeEditor(){

    //creates new socketRef to a websocket with null path. similar to a file descriptor
    const socketRef = useRef<WebSocket | null>(null)
    
    const [code, setCode] = useState("//placeholder")

    //an object where keys strings and values are {line, column} objects
    const [cursors, setCursors] = useState<Record<string, {line: number, column: number} >> ({})
    //useRef stops value from being reset on re-render. makes something similar to a static local variable
    //random ID persists through re-renders, but generated differently for each client
    const userId = useRef(crypto.randomUUID())
    const isRemoteUpdate = useRef(false)


    //holds monaco editor instance
    //starts as null because it doesnt exist yet, gets created after component mounts
    //IStandaloneCodeEditor is the type of the editor instance
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

    //holds decorations collection for editor. this is how we display other users cursors
    const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)

    //everytime cursors state is updated, this runs
    useEffect(() => {
        //checks if both exists
        if(editorRef.current && decorationsRef.current){

            //need this all explained tmr
            decorationsRef.current.set(Object.entries(cursors).map(([userId, {line, column}]) => {
                return {
                    range: new monaco.Range(line, column, line, column),
                    options: {className: 'remote-cursor'}
                }
            }))
                            
        }
                        


    //loops over each entry in cursors object and creates a decoration for each one
    }, [cursors])

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
      //gets the message from text and parses it to JSON
      const message = JSON.parse(text)
      //checks what type of message it is. if its code, then its updated for all in the editor
      if(message.type === "code"){
// Guards against infinite loop: without this, setCode() would trigger onChange,
// which would re-send the message back to the server, which would broadcast again, etc.
//meaning infinite broadcasts of the same message back and forth between client and server
        isRemoteUpdate.current = true
        setCode(message.content)
      }
      else if(message.type === "cursor"){

        //can test cursors updating by logging each time a cursor message is received
        //console.log(cursors)
        //updates state based on what it was before
        //existing cursors object
        setCursors(prev => ({
            //speads existing cursors entries into new object
            ...prev,
            //adds new entry on top of this
            [message.userId]: {line: message.line, column: message.column}
      }))
    }}

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
                //called after rendering editor for the first time
                onMount={(editor) => {
                    editorRef.current = editor
                    //creates decoration cllections. how the users cursors are displayed.
                    //[] because it begins as empty
                    decorationsRef.current = editor.createDecorationsCollection([])

                    //registers listener to detect cursor position changes
                    editorRef.current.onDidChangeCursorPosition((e) =>{

                            if(socketRef.current?.readyState === 1){
                            //sends JSON string with cursor, userId, line, and column to server whenever cursor position changes
                            socketRef.current?.send(JSON.stringify({type:"cursor", userId: userId.current, line: e.position.lineNumber, column: e.position.column}))
                        }
                    })
                }
            }
                onChange = {(value) => {
                    if(isRemoteUpdate.current){
                        isRemoteUpdate.current = false
                        return
                    }
                    if(socketRef.current?.readyState === 1){
                        socketRef.current.send(JSON.stringify({type: "code", content: value ?? ""}))
                    }
                    setCode(value ?? "")
                }
            }
            />
        </div>
    )
}