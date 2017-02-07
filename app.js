'use strict';

let app = require('express')();
let http = require('http').Server(app);
var bodyParser = require('body-parser');
app.use(bodyParser.json());

//const allowedOrigins = ['http://localhost:4200', 'http://uatfacewatch.herokuapp.com'];
app.all('/*', function (req, res, next) {
  // var origin = request.headers.origin;
  // if (allowedOrigins.indexOf(origin) > -1) {
  //      response.setHeader('Access-Control-Allow-Origin', origin);
  // }
  //response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');

  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
});

//Start Socket.IO area
let io = require('socket.io')(http);
var userlist = [];
io.on('connection', function (socket) {
  if (socket.handshake.query.id) {
    //If user exixtes in array then update new socketid otherwise push him into array
    var index = userlist.findIndex(x => x.id === socket.handshake.query.id);
    if (index >= 0) {
      userlist[index].socketid = socket.id;
    }
    else {
      var user = { id: socket.handshake.query.id, socketid: socket.id };
      userlist.push(user);
    }     
  }

  console.log("client connected")

  //pull the list of online users
  socket.on('pulllist', function () {
    io.sockets.emit('getlist', userlist);
  });

 //send message to particular user
  socket.on('sendmessage', function (data) {
    var index = userlist.findIndex(x => x.id === data.receiver);
    if (index >= 0) {
      io.sockets.connected[userlist[index].socketid].emit('message', data);
    }
      
  });

  //Will be fired when user logouts from screen or close the browser
  socket.on('disconnect', function () {  
    // remove disconnected user from online users array
    var index = userlist.findIndex(x => x.socketid === socket.id);
    if (index >= 0) {
      var id = userlist[index].id;
      userlist.splice(index, 1);

      io.sockets.emit('disconnected', id);
      if (socket.id !== undefined) {
        //notify all users that this user is disconnect now
        socket.leave(socket.id);
      }
    }   
  });
});

//End Socket.IO area


http.listen(app.get('port'), () => {
  console.log('started on port ' + app.get('port'));
});
