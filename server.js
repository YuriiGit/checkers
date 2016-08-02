//const
var WAITING_TO_START = 0;
var START_GAME = 1;
var GAME_OVER = 2;
var RESTART_GAME = 3;
		
var CHAT_MESSAGE = 0;
var GAME_MESSAGE = 1;
var CREATE_ROOM = 2;
var UPDATE_LIST = 3;
var SELECTED_ROOM = 4;
var INFO_MESSAGE = 5;

var WebSocketServer = require('./lib/websocket').server;
var http = require('http');
var fs = require('fs');

var rooms = [];
var connections = [];

var server = http.createServer(function(request, response) {

	//Load Resources
    if (request.url == "/") {
        fs.readFile('index.html', 'utf8', function(err, data) {
            if (!err) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(data);
            }
        });
    }
	else if (request.url == "/client.js") {
        fs.readFile('client.js', 'utf8', function(err, data) {
            if (!err) {
                //response.writeHead(200, {'Content-Type': 'text/javascript'});
                response.end(data);
            }
        });
    }
	else if (request.url == "/jquery-1.6.4.min.js") {
        fs.readFile('jquery-1.6.4.min.js', 'utf8', function(err, data) {
            if (!err) {
                //response.writeHead(200, {'Content-Type': 'text/javascript'});
                response.end(data);
            }
        });
    }
	else if (request.url == "/main.css") {
        fs.readFile('main.css', 'utf8', function(err, data) {
            if (!err) {
                //response.writeHead(200, {'Content-Type': 'text/css'});
                response.end(data);
            }
        });
    }
	else if (request.url == "/background.jpg") {
        fs.readFile('background.jpg', function(err, data) {
            if (!err) {
                //response.writeHead(200, {'Content-Type': 'text/javascript'});
                response.end(data);
            }
        });
    }
	else {
        response.writeHead(404);
        response.end();
    }
	
});

server.listen(8001, function()
{
	var d = new Date(); 
	console.log(timestamp()+ ': Server is listening on port 8001');
});

wsServer = new WebSocketServer(
{
	httpServer: server,
	autoAcceptConnections: false
});

function originIsAllowed(origin)
{
	//Тут має бути перевірка чи дозволяєтся 'підключення'
	return true;
}

wsServer.on('request', function(request)
{
	var d = new Date();
	if(!originIsAllowed(request.origin))
	{
		request.reject();
		console.log(timestamp() + ': Connection from origin ' + request.origin + 'rejected.');
		return;
	}
	
	var connection = request.accept('echo-protocol', request.origin);
	console.log(timestamp() +': Connection accepted.');
	
	//connection.sendUTF((d.getHours())+':'+(d.getMinutes()) +':'+ (d.getSeconds()) +' '+wsServer.connections.length);
	///////////////////////
	var message = ('Total connection: '+wsServer.connections.length);
	var data = {};
	data.dataType = CHAT_MESSAGE;
	data.sender = "Server";
	data.time = timestamp();
	data.message = message;
	wsServer.broadcast(JSON.stringify(data));
	connections.push(connection);
	/*
	for(var i=0; i<connections.length; i++)
	{
		connections[i].send("Hello World" + i);
	}*/
	///////////////////////////////////////////////////////////////////////

	connection.on('message', function(message)
	{	
		//if(message.type === 'utf8'){
			//console.log('Received Message: ' + message.utf8Data);}
		var data = JSON.parse(message.utf8Data);
		if(data.dataType == CHAT_MESSAGE)
		{
			if(data.idRoom != 0) {
				for(var i=0; i< rooms.length; i++) {
					if(rooms[i].id == data.idRoom) {
						//data.sender = "Guest";
						data.time = timestamp();
						rooms[i].p1.send(JSON.stringify(data));
						rooms[i].p2.send(JSON.stringify(data));
						return;
					}
				}
			}
			//data.sender = "Guest";
			data.time = timestamp();
		}
		if(data.dataType == GAME_MESSAGE)
		{
			for(var i=0; i< rooms.length; i++) {
				if(rooms[i].id == data.idRoom) {
					if(rooms[i].player == 1){
						rooms[i].player = -1;
					} else{
						rooms[i].player = 1;
					}
					data.playnow = rooms[i].player;
					rooms[i].p1.send(JSON.stringify(data));
					rooms[i].p2.send(JSON.stringify(data));
					return;
				}
			}
		}
		if(data.dataType == CREATE_ROOM)
		{	
			//create new room
			rooms.push(new Array());
			rooms[rooms.length-1].player = 1;
			rooms[rooms.length-1].p1 = connection;
			rooms[rooms.length-1].id = 1000+rooms.length;
			rooms[rooms.length-1].p1Name = data.sender;

			var data1 = {};
			//send message author room
			data1.stateGame = WAITING_TO_START;
			data1.idRoom = rooms[rooms.length-1].id;
			connection.send(JSON.stringify(data1));
			
			//send message update list rooms
			data.dataType = UPDATE_LIST;
			data.roomId = rooms[rooms.length-1].id;
			data.p1Name = rooms[rooms.length-1].p1Name;
		}
		if(data.dataType == SELECTED_ROOM)
		{
			for(var i=0; i< rooms.length; i++) {
				if(rooms[i].id == data.idRoom) {
					rooms[i].p2 = connection;
					
					var gameData = {};
					gameData.dataType = GAME_MESSAGE;
					gameData.gameState = START_GAME;
					gameData.playnow = rooms[i].player;
					gameData.player = -1;
					rooms[i].p1.send(JSON.stringify(gameData));
					gameData.player = 1;
					rooms[i].p2.send(JSON.stringify(gameData));
					return;
				}
			}
		}				
		wsServer.broadcast(JSON.stringify(data));
	});
	connection.on('close', function(reasonCode, description)
	{
		var d = new Date();
		console.log(timestamp() + ': Peer ' + connection.remoteAddress + ' disconnected.');
		for(var i=0; i < connections.length; i++)
		{
			if(connections[i] == connection)
				connections.splice(i,1); 
		}
	});
});

//var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}
//Форматування часу	
function timestamp() {
  var d = new Date();
  return [[
    d.getDate(),
    //months[d.getMonth()],
	pad(d.getMonth()+1)].join('.'),
    [ pad(d.getHours())
    , pad(d.getMinutes())
    , pad(d.getSeconds())
    ].join(':')
  ].join(' ');
};