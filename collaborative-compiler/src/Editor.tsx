import Editor from "@monaco-editor/react"
import {useState} from 'react'

export default function CodeEditor(){
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
            />
        </div>
    )
}