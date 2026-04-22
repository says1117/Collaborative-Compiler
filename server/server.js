//imports ws package. websocket. {WebSocketServer} destructures only the websocketserver part of package
const { WebSocketServer } = require('ws')

//new WebSocketServer listening on port 8080
const wss = new WebSocketServer({port: 8080})

//listens on the websocketserver. everytime a new browser connects, send message to that socket
wss.on('connection', (socket) => {console.log('Client Connected.')
    
    //listens on the socket. if a message/data is entered, (data) is what the sent, and is sent
    socket.on('message', (data) => {

        //puts data into a string
        const raw = data.toString()
        //parses string into a json object
        const parseMsg = JSON.parse(raw)
        
        //gets msg type from the message
        const msgType = parseMsg.type
        //prints out the type of message it has recieved
        console.log('Recieved:', msgType)
        //Broadcast to all except sender
        wss.clients.forEach((client) => {
            if(client !== socket && client.readyState === 1){
                //displays all current data to the sockets that are not the sender and are in a ready state
                client.send(data)
            }
        })
    })
    //when the browser disconnects, message that the client closed
    socket.on('close', () => {
        console.log('Client Disconnected.')
    })
})