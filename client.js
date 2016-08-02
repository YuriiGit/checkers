var websocketGame = {
		//стан гри
		WAITING_TO_START : 0,
		START_GAME : 1,
		GAME_OVER : 2,
		RESTART_GAME : 3,
		//типи повідомлень
		CHAT_MESSAGE : 0,
		GAME_MESSAGE : 1,
		CREATE_ROOM : 2,
		UPDATE_LIST : 3,
		SELECTED_ROOM : 4,
		INFO_MESSAGE : 5
}
var board, num_red_pieces, num_black_pieces, player, current_move;
var youPlayer;
var idRoom;

$(function()
{
	var sY = null;
	var sX = null;
	
	// проверка WebSockets в браузере
	if (window["WebSocket"]) 
	{
		$("#canv").hide();
		$("#cont").hide();
		$('div.indicator').hide();
		// создаем подключение
		//websocketGame.socket = new WebSocket("ws://websockgame.jit.su", "echo-protocol");
		websocketGame.socket = new WebSocket("ws://127.0.0.1:8001", "echo-protocol");
		
		var nick = prompt('Enter your name:', 'Guest');
		
		// при событии open
		websocketGame.socket.onopen = function(e) {
			console.log('WebSocket connection established.');
		};
    
		// при получении сообщения
		websocketGame.socket.onmessage = function(e) 
		{
			console.log("onmessage event:", e.data);
		
			var data = JSON.parse(e.data);
			if(data.dataType == websocketGame.CHAT_MESSAGE)
			{
				$("#chat-output").append("<li>["+data.time+"]: "+data.sender+": "+data.message+"</li>");
			}
			else if(data.dataType == websocketGame.GAME_MESSAGE)
			{
				if(data.gameState == websocketGame.START_GAME){
					$("#info").hide();
					$("#canv").show();
					$("#cont").show();
					$('div.indicator').show();
					youPlayer = data.player;
					NewGame();
					$('div.indicator').text('Червоні').animate({top: '210px'}, 500);
				}
				player = data.playnow;
				MakeTheMove(data.newCords, data.oldCords);
				//board[data.newx][data.newy] = board[data.oldx][data.oldy];
				//board[data.oldx][data.oldy] = 0;
				//CleanBoard();
				//DrawBoard();
			}
			else if(data.dataType == websocketGame.UPDATE_LIST)
			{
				$("#list").append('<input type="radio" name="listroom" value="'+data.roomId+'" />' +data.roomId +" Створив: " + data.p1Name+'<br>');
			}
			else if(data.stateGame == websocketGame.WAITING_TO_START)
			{
				idRoom = data.idRoom;
			}
		};
		
		// при событии close
		websocketGame.socket.onclose = function(e) {
			console.log('WebSocket connection closed.');
		};  

		$("#chat-send").click(sendMessage);
		$("#create").click(createRoom);
		$("#enter").click(enterRoom);

		$("#chat-input").keypress(function(event)
		{
			if(event.keyCode == '13')
			{
				sendMessage();
			}
		});	

		function sendMessage()
		{
			var message = $("#chat-input").val();
		
			var data = {};
			data.dataType = websocketGame.CHAT_MESSAGE;
			data.message = message;
			data.sender = nick;
			data.idRoom = idRoom || 0;
		
			websocketGame.socket.send(JSON.stringify(data));
			$("#chat-input").val("");
		}
		
		function createRoom()
		{
			var data = {};
			data.dataType = websocketGame.CREATE_ROOM;
			data.sender = nick;
			websocketGame.socket.send(JSON.stringify(data));
		}

		function enterRoom()
		{	
			var elems = document.getElementsByName("listroom");

			for(var i = 0; i < elems.length; i++) {
				if(elems[i].checked == true) {
					idRoom = elems[i].value;
				}
			}

			var data = {};
			data.dataType = websocketGame.SELECTED_ROOM;
			data.idRoom = idRoom;
			websocketGame.socket.send(JSON.stringify(data));
		}		
		
	}

/////////////////////////////////////////////////////////////////////
var canvas = $('#checkers')[0]
var context = canvas.getContext('2d');
//var snd = new Audio('checker_click.wav');


function NewGame() {
   board = new Array(8);
   for (var x = 0; x < 8; x++) {
      board[x] = new Array(8);
   }

   num_red_pieces = 12;
   num_black_pieces = 12;

   // Initialize pieces
   // 0 = nothing, 1=p1, -1=p2
   for (var x = 0; x < 8; x++) {
      for (var y = 0; y < 8; y++) {
         board[x][y] = 0; 
      }
   }
   for (var x = 0; x < 8; x += 2) {
      board[x][0] = 1;
      board[x+1][1] = 1;
      board[x][2] = 1;

      board[x+1][5] = -1;
      board[x][6] = -1;
      board[x+1][7] = -1;
   }

   //player = 1;

   current_move = new Array(); // e.g. [[1,1],[3,3],[5,1]] = 2 jumps from 1,1

   DrawBoard();
}

function DrawPieces() {
   context.strokeStyle = "black";
   for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
         var checker = board[x][y];
         if (checker != 0) {

            if (checker % 3 == 0) checker /= 3;

            context.fillStyle = (checker>0)?"red":"black";
            var x_pix = 60*x;
            var y_pix = 60*y;
            if ( Math.abs( checker ) == 1 ) {
               context.beginPath();
               context.moveTo( x_pix + 30, y_pix + 8 );
               context.arc( x_pix + 30, y_pix + 30, 18, 0, Math.PI*2, false);
               context.fill();
            } else {
               context.beginPath();
               context.moveTo( x_pix + 30, y_pix + 12 );
               context.arc( x_pix + 30, y_pix + 24, 12, 0, Math.PI*2, false);
               context.fill(); 

               context.beginPath();
               context.moveTo( x_pix + 30, y_pix + 4 );
               context.arc( x_pix + 30, y_pix + 16, 12, 0, Math.PI*2, false);
               context.fill(); 
            }
         }
      }
   }
}

function DrawPendingMove() {

   context.fillStyle = "rgba(16, 78, 139, 0.2)";
   for (var i = 0; i < current_move.length; ++i) {
      var x_pix = current_move[i][0] * 60;
      var y_pix = current_move[i][1] * 60;
      context.fillRect( x_pix, y_pix, 60, 60 );
   }

   if (current_move.length > 1) {
      context.fillStyle = "rgb(255, 80, 80)";
	  /*
      roundedRect( context, 110, 480, 100, 25, 35, true );
      context.fillStyle = "black";
      context.font = "14pt sans-serif";
      context.fillText( "Підтвердити хід", 113, 500);
*/
      for (var i = 1; i < current_move.length; ++i) {
         // Draw move arrow
         var x_pix_start = current_move[i-1][0] * 60;
         var y_pix_start = current_move[i-1][1] * 60;
         var x_pix_end = current_move[i][0] * 60;
         var y_pix_end = current_move[i][1] * 60;
         var x_dir = ((x_pix_end - x_pix_start) > 0)?-10:10;
         var y_dir = ((y_pix_end - y_pix_start) > 0)?-10:10;

         context.strokeStyle = "rgba(0, 0, 0, 0.5)";
         context.fillStyle = "rgba(0, 0, 0, 0.5)";

         context.beginPath();
         context.moveTo(x_pix_start + 30, y_pix_start + 30);
         context.lineTo(x_pix_end + 30 + (x_dir/2), y_pix_end + 30 + (y_dir/2));
         context.stroke();

         context.beginPath();
         context.moveTo(x_pix_end + 30, y_pix_end + 30);
         context.lineTo(x_pix_end + x_dir + 30, y_pix_end + 30);
         context.lineTo(x_pix_end + 30, y_pix_end + y_dir + 30);
         context.fill();
      }
   }
   
}

function DrawInterface() {

   if (current_move.length > 0) {
      DrawPendingMove();
   }
}

function CleanBoard() {
   // Unmarks previously marked pieces
   for (var x = 0; x < 8; ++x) {
      for (var y = 0; y < 8; ++y) {
         if (board[x][y] % 3 == 0)
            board[x][y] /= 3;
      }
   }
}

function DrawBoard() {
   context.fillStyle = "rgb(30,30,30)"; 
   context.clearRect( 0, 0, 480, 480 );
   context.fillRect( 0, 0 , 480, 480 );

   context.fillStyle = "rgb(240,240,240)"; 
   for (var y = 0; y < 480; y += 60) {
      for (var x = 0; x < 480; x += 60) {
         if ( (x + y) % 120 == 0 ) {
            context.fillRect( x, y, 60, 60 );
         }
      }
   }

   DrawPieces();
   DrawInterface();
}
///////////////////////////////////////////////////////////////////////////////
function definitionCoords()
{
	var start = [];
	var end = [];
	for (var i = 0; i < current_move.length - 1; ++i) {
		start[i] = current_move[i];
		end[i] = current_move[i + 1];
	}
	var gameData = {};
	gameData.dataType = websocketGame.GAME_MESSAGE;
	gameData.oldCords = start;
	gameData.newCords = end;
	gameData.idRoom = idRoom;
	websocketGame.socket.send(JSON.stringify(gameData));
	
}
///////////////////////////////////////////////////////////////////////////////
function MakeTheMove(newCords, oldCords) {

		for (var i = 0; i < newCords.length; ++i) {
		var start = oldCords[i];
		var end = newCords[i];
		if ( Math.abs( start[0] - end[0] ) == 2 ) { // capture
			var mid_x = (start[0] + end[0]) / 2;
			var mid_y = (start[1] + end[1]) / 2;
			board[mid_x][mid_y] = 0;
			if (this.player==1)
				num_black_pieces--;
			else
				num_red_pieces--;
			
		};
		board[end[0]][end[1]] = board[start[0]][start[1]];
		board[start[0]][start[1]] = 0;
   }
   
   //snd.currentTime = 0;
   //snd.play();

   // Promotion
   
   if (end[1] == ((player == -1)?7:0)) {
      if ( Math.abs( board[ end[0] ][ end[1] ] ) == 1 ) {
         board[ end[0] ][ end[1] ] *= 2;
      }
   }

   if (num_red_pieces == 0 || num_black_pieces == 0) {
      alert( "Game Over!" );
   }
	if(player == -1) {
		$('div.indicator').text('Чорні').animate({top: '450px'}, 500);
	} else {
		$('div.indicator').text('Червоні').animate({top: '210px'}, 500);
	}

   current_move = new Array();
   CleanBoard();
   //player = -player;
   DrawBoard();
}
////////////////////////////////////////////////////////////////////////////////
var OnClick = function( e ) {

   if(youPlayer != player){
	    return;
   }
   var x_pix = sX || e.pageX - canvas.offsetLeft;
   var y_pix = sY || e.pageY - canvas.offsetTop;

   if (y_pix < 470) {
      if (num_black_pieces == 0 || num_red_pieces == 0) {
         // game is over
         return;
      }

      // If on active board, is it a valid move specification?
      var x = Math.floor(x_pix / 60);
      var y = Math.floor(y_pix / 60);

      var move_length = current_move.length;

      if (move_length == 0) {

         // No current piece, so is the player's piece?
		 
         if (board[x][y] == player ||
               board[x][y] == player * 2) {
            current_move.push( new Array( x, y ) );
            DrawBoard();

			$('p').text( "Initial piece selected." );
            return;
         }
      } else {
         // Does move follow from the previous one?
         var old_x = current_move[ move_length - 1 ][0];
         var old_y = current_move[ move_length - 1 ][1];

         if ( x == old_x && y == old_y ) { //take the last move back
            current_move.pop();
            if ( move_length > 1 && 
                  Math.abs( old_x - current_move[move_length - 2][0] ) == 2 ) {
               // Clean jumped piece
               board[ ( current_move[move_length - 2][0] + old_x) / 2 ]
                  [ ( current_move[move_length - 2][1] + old_y) / 2 ] /= 3;
            }
            DrawBoard();
            return;
         }
		 

         if ( x == current_move[0][0] && y == current_move[0][1] 
               && (move_length < 4 || move_length % 2 != 0) ) {
            // It is possible to cycle back around, so that will be allowed.
            current_move = new Array();
            CleanBoard();
            DrawBoard();
            return;
         }

         if (move_length > 1 &&
               Math.abs(current_move[ move_length - 2 ][0] - old_x) == 1) {
            return; // Last move not a capture, can't continue the move
         }

         // Otherwise, just need to check if the move is possible from position
         if ( Math.abs( old_x - x ) != Math.abs( old_y - y ) ) {
            return; // Not a diagonal move, clearly not possible
         }

         if ( board[x][y] != 0 &&
               (x != current_move[0][0] || y != current_move[0][1]) ) {
            return; // There's a piece in the way, this isn't the moving piece
         }

         if ( Math.abs( old_x - x ) == 2 ) {
            var jumped_x = ( x + old_x ) / 2;
            var jumped_y = ( y + old_y ) / 2;

            if ( board[jumped_x][jumped_y] != -player &&
                  board[jumped_x][jumped_y] != -player * 2) {
               return; // Not jumping an enemy piece
            }
            else
            {
               board[jumped_x][jumped_y] *= 3; // Mark as will-be-jumped
            }
			
         }
		 
         if ( Math.abs( board[ current_move[0][0] ][ current_move[0][1] ] ) == 1 &&
               ( (y - old_y) > 0 ) != ( player > 0 ) ) {
            return; // Non-promoted piece going the wrong way.
         }

         // Seems to check out!
         current_move.push( new Array( x, y ) );
         DrawBoard();
         return;
      }
    } /*else {
      // If not on the board, did they click an active button?

      if ( current_move.length > 1 &&
            x_pix > 110 && x_pix <= 210 &&
            y_pix > 460 && y_pix <= 480 ) {
         //MakeTheMove();
		 definitionCoords();
      } else if ( x_pix > 230 && x_pix <= 305 &&
            y_pix > 330 && y_pix <= 350 ) {
         NewGame();
      }
   }*/
}

$('#checkers').click( OnClick ); 
$('#go').click( OnGo ); 
$('#exit').click( OnExit ); 

function OnGo() {
	definitionCoords();
}

function OnExit() {
	$("#canv").hide();
	$("#cont").hide();
	$("#info").show();
}

//NewGame();
});	