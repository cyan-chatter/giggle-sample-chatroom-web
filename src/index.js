const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const Filter = require('bad-words')

const {generateMessage, generateLocation} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const port = process.env.PORT || 5500

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))



io.on('connection', (socket)=>{
    console.log('New Web Socket Connection')

    socket.on('join', (options, callback)=>{
        const {error, user} = addUser({ id: socket.id, ...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('', `${user.username} has joined the chat`))    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    socket.on('send-message',(messageText, callback)=>{   
        const user = getUser(socket.id)       
        const filter = new Filter()
        if(filter.isProfane(messageText)){
            return callback('Profanity is Not Allowed Here!. Keep the Chat Clean')
        }
        
        io.to(user.room).emit('message',generateMessage(user.username, messageText))
        callback('Message Delivered!')
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('', `${user.username} has left the chat`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
    })
    
    socket.on('send-location', (location,callback)=>{
        const user = getUser(socket.id)
        const messageText = `https://google.com/maps?q=${location.latitude},${location.longitude}`
        io.to(user.room).emit('locationMessage', generateLocation(user.username, messageText))
        callback()
    })
})


server.listen(port,()=>{
    console.log('Server is up at Port: ', port);
})