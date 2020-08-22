//const messages = require("../../src/utils/messages")

const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix:true})

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        // scroll to the bottom 
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (location)=>{
    console.log(location)
    const html = Mustache.render(locationTemplate,{
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()    
})

socket.on('roomData', ({room , users})=>{
    const html = Mustache.render(sidebarTemplate, {
      room,
      users  
    })

    document.querySelector('#sidebar').innerHTML = html
})

 $messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const messageText = e.target.elements.message_text.value
    socket.emit('send-message',messageText,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus() 
        if(error){
           return console.log(error)    
        }
        console.log('Message Delivered!')
    })
 })

 $locationButton.addEventListener('click', ()=>{
     
     if(!navigator.geolocation){
         return alert('Geolocation is not supported by your Browser.  :(')
     }

     $locationButton.setAttribute('disabled', 'disabled')

     navigator.geolocation.getCurrentPosition((position)=>{
           
        const locate = {
            latitude: undefined,
            longitude: undefined
        }
           locate.latitude = position.coords.latitude
           locate.longitude = position.coords.longitude

           socket.emit('send-location', locate,()=>{
            console.log('Location Shared!')
            $locationButton.removeAttribute('disabled')
           })      
        })
     
 })

socket.emit('join',{username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})