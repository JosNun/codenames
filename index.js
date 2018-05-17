/*
TODO:
[x] Remove the extra game names from the datalist OR
[x] Mobilify it
[x] Bolden the players name, and indicate what team they are on
[x] Abort card guess if it is not that team's turn
[x] Clean up everything, and reorder it, and break it into modules
[x] Fix global chat
[ ] Remove old/finished games
[ ] reset sign in form on game join
[ ] Overhaul game selection
[ ] check player socket id before joining game
[ ] Maybe save the socket id using the web storage API, then, use that for reconnecting
[ ] Allow a way to set a player's name in the menu
[ ] Show game info in setup screen
[ ] use winston for logging
[ ] gulp + nodemon for build tools
[ ] history.push/pop state for different rooms
[ ] webRTC real-time audio
[ ] gzip the HTML, CSS, and client JS
[ ] Promisify all the things (also provides error handling) https://expressjs.com/en/advanced/best-practice-performance.html#handle-exceptions-properly
*/

const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const codenames = require('./codenames');

codenames.setIo(io);

const PORT = process.env.PORT || 3000;

app.use(express.static('site'));

codenames.loadWordList();

io.on('connection', socket => {
  console.log('a user connected');

  socket.on('game query', (id, msg) => {
    const game = codenames.findGame(msg);
    if (typeof game === 'object') {
      socket.emit('game query response', game.makeClientCopy());
    } else {
      socket.emit('game query response', false);
    }
  });

  socket.on('create game', name => {
    console.log(`creating game... ${name}`);
    codenames.createGame(name);
  });

  socket.on('join game', req => {
    console.log(
      `join game request recieved for ${req.gameId} from ${req.socketId}`
    );
    const { gameId } = req;

    const playerReq = req;
    delete playerReq.gameId;

    const playerAdded = codenames
      .findGame(gameId)
      .addPlayer(playerReq, io.sockets);

    socket.emit('game join response', !playerAdded, playerAdded);
  });

  socket.on('games list request', callback => {
    console.log('Games list request recieved');

    const gameNames = [];

    codenames.getGames().forEach(game => {
      const name = game.id;
      gameNames.push(name);
    });

    callback(gameNames);
  });

  socket.on('send final game', () => {
    console.log('Sending final game');

    codenames.getGames().forEach(game => {
      io.to(game.id).emit('game update', game);
    });
  });

  socket.on('card guess', (currentGame, guess) => {
    const game = codenames.findGame(currentGame);
    if (typeof game === 'undefined') return console.log('Game not found');
    const guessTeam = game.players.find(player => player.socket === socket.id)
      .team;
    if (guessTeam !== game.turn) {
      return console.log(`player acted out of turn`);
    }
    console.log(`Looking for card ${guess}`);

    for (let i = 0; i < game.board.length; i += 1) {
      if (game.board[i].word.toLowerCase() === guess.toLowerCase()) {
        game.board[i].revealed = true;
        game.teams[game.board[i].team].cardsRemaining -= 1;

        if (game.board[i].team !== guessTeam) {
          game.endTurn(guessTeam);
        }
        break;
      }
    }
    game.updateClients();
    return true;
  });

  socket.on('chat message', payload => {
    console.log('Chat message recieved');
    if (payload.room === 'global') {
      socket.broadcast.emit('chat message', payload);
    } else {
      socket.to(payload.room).emit('chat message', payload);
    }
  });

  socket.on('request game update', (id, room) => {
    const game = codenames.findGame(room);

    const playerRole = game.players.find(player => player.socket === id).role;

    if (playerRole === 'spymaster') {
      socket.emit('game update', codenames.findGame(room).makeSpymasterCopy());
    } else {
      socket.emit('game update', codenames.findGame(room).makeClientCopy());
    }
  });

  socket.on('end turn', (team, game) => {
    codenames.findGame(game).endTurn(team);
  });

  socket.on('emit request', params => {
    socket.broadcast.emit(...params);
  });
});

http.listen(PORT, () => {
  console.log('Listening on *:3000');
});
