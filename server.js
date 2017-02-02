    var app = require('express')();

    var server = require('http').Server(app);

    var io = require('socket.io')(server);


    // Heroku won't actually allow us to use WebSockets
    // so we have to setup polling instead.
    // https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku


   var port = 3000;  // Use the port that Heroku provides or default to 5000  
    //server.listen(80);
     server.listen(port, function() {
          console.log("Express server listening on port %d ", port);
      });


    var userlist = [];

    io.on('connection', function (socket) {
   


    if (socket.handshake.query.id) {
      var found=false;
      for(var i = 0; i < userlist.length; i++) {
          if (userlist[i].socketid == socket.id) {
              found = true;
              break;
          } 
        }
        if(!found){
           console.log(socket.handshake.query.id);
           var user={id: socket.handshake.query.id,socketid: socket.id};
           userlist.push(user);
        }       
     }

    console.log("client connected")
     socket.on('pulllist', function () {
        console.log('test');         
        io.sockets.emit('getlist', userlist);
      });

      socket.on('sendmessage', function ( data) {
       for(var i = 0; i < userlist.length; i++) {
            if(userlist[i].socketid === data.receiver) {
               console.log('message sent to' + userlist[i].socketid)
               io.sockets.connected[userlist[i].socketid].emit('message', {  message: data.message, sender: data.sender, receiver: data.receiver});
             break;
            }
         }      
     });


   
     

      socket.on('disconnect', function() {
        //var index=userlist.findIndex(x => x.socketid == socket.id);
         var id = '';
         for(var i = 0; i < userlist.length; i += 1) {
            if(userlist[i].socketid === socket.id) {
              id = userlist[i].id;
              userlist.splice(i, 1);
            }
         }

          
           io.sockets.emit('disconnected', id);
           if (socket.id !== undefined) {      
              socket.leave(socket.id);
           }
          

      });

    
 

});