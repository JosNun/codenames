/*
TODO:
[ ] check player socket id before joining game
[ ] Clean up everything, and reorder it
*/

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let fs = require('fs');

app.use(express.static('site'));

let wordList;
let games = [];
global.game;

loadWordList();

io.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('game list request', (id) => {
    socket.emit('game list', games);
  });

  socket.on('game query', (id, msg) => {
    let game = findGame(msg);
    if (typeof game === 'object') {
      socket.emit('game query response', game.makeClientCopy());
    } else {
      socket.emit('game query response', false);
    }
  });

  socket.on('create game', (msg) => {
    console.log('creating game... ' + msg);
    new Game(msg);
  });

  socket.on('join game', (req) => {
    console.log(
      'join game request recieved for ' + req.gameId + ' from ' + req.socketId
    );
    let gameId = req.gameId;

    let playerReq = req;
    delete playerReq.gameId;

    let playerAdded = findGame(gameId).addPlayer(playerReq);

    socket.emit('game join response', !playerAdded, playerAdded);
  });

  socket.on('games list request', (callback) => {
    console.log('Games list request recieved');

    let gameNames = [];

    games.forEach((game, i) => {
      let name = game.id;
      gameNames.push(name);
    });

    callback(gameNames);
  });

  socket.on('send final game', () => {
    console.log('Sending final game');
    console.log(games);

    games.forEach((game) => {
      io.to(game.id).emit('game update', game);
    });
  });

  socket.on('card guess', (currentGame, guess) => {
    console.log(`Looking for card ${guess}`);
    console.log(currentGame);
    let game = findGame(currentGame);
    console.log(game);
    for (let i = 0; i < game.board.length; i++) {
      if (game.board[i].word.toLowerCase() === guess.toLowerCase()) {
        game.board[i].revealed = true;
        game.teams[game.board[i].team].cardsRemaining--;
        break;
      }
    }
    game.updateClients();
  });

  socket.on('chat message', (payload) => {
    console.log('message recieved');
    if (payload.room === 'global') {
      socket.broadcast.emit('chat message', payload);
    } else {
      socket.to(payload.room).emit('chat message', payload);
    }
  });

  socket.on('request game update', (id, room) => {
    let game = findGame(room);
    let role;
    for (let player of game.players) {
      if (player.socket === id) {
        role = player.role;
      }
    }

    if (role === 'spymaster') {
      socket.emit('game update', findGame(room).makeSpymasterCopy());
    } else {
      socket.emit('game update', findGame(room).makeClientCopy());
    }
  });
});

http.listen(3000, function() {
  console.log('Listening on *:3000');
});

/**
 * a game room
 */
class Game {
  /**
   * @param {String} id - the games unique id
   */
  constructor(id) {
    this.id = id.toLowerCase();
    this.players = [];
    this.board = [];
    this.usedWords = [];
    this.teams = {
      blue: {
        color: 'blue',
        cards: 8,
      },
      red: {
        color: 'red',
        cards: 8,
      },
      neutral: {
        color: 'tan',
        cards: 7,
      },
      assassin: {
        color: 'black',
        cards: 1,
      },
    };

    this.generateBoard();
    games.push(this);
    global.game = this;
  }

  /**
   * generate a new game board
   */
  generateBoard() {
    // Choose which team goes first
    if (Math.random >= 0.5) {
      this.teams['blue'].cards++;
      this.teams['blue'].isFirst = true;
    } else {
      this.teams['red'].cards++;
      this.teams['red'].isFirst = true;
    }

    this.teams.blue.cardsRemaining = this.teams.blue.cards;
    this.teams.red.cardsRemaining = this.teams.red.cards;

    // Make the cards
    for (let i = 0; i < 25; i++) {
      let word = getRandomWord();
      let team;
      while (this.usedWords.includes(word)) {
        // console.log(word + ' is in used words list');
        word = getRandomWord();
      }

      if (this.teams.blue.cards > 0) {
        this.teams.blue.cards--;
        team = 'blue';
      } else if (this.teams.red.cards > 0) {
        this.teams.red.cards--;
        team = 'red';
      } else if (this.teams.assassin.cards > 0) {
        this.teams.assassin.cards--;
        team = 'assassin';
      } else {
        this.teams.neutral.cards--;
        team = 'neutral';
      }
      this.usedWords.push(word);

      let card = new Card(word, team);
      console.log(JSON.stringify(card, null, 2));
      this.board.push(card);
    }

    // delete total cards amount (useless now anyway)
    Object.keys(this.teams).forEach((key) => {
      delete this.teams[key].cards;
    });

    this.board = shuffle(this.board);
    console.log(this.board);
  }

  /**
   * Add a player to the game
   * @param {string} req - the request object
   * @return {String} an error if there is one, otherwise an empty string
   */
  addPlayer(req) {
    let error;

    /**
     *
     * @param {String} team - Team of the joining player
     * @param {*} players - list of players to check
     * @return {boolean} If the array of players already has a spymaster already
     */
    function teamHasSpymaster(team, players) {
      let hasSpymaster = false;
      for (let player of players) {
        if (player.team === team && player.role === 'spymaster') {
          hasSpymaster = true;
          break;
        }
      }
      return hasSpymaster;
    }

    for (let player of this.players) {
      if (player.name.toLowerCase() === req.nickname.toLowerCase()) {
        error = 'Player already joined';
        break;
      } else if (
        req.role === 'spymaster' &&
        teamHasSpymaster(req.team, this.players)
      ) {
        error = 'There is already a Spymaster';
        break;
      } else {
        error = '';
      }
    }

    if (!error) {
      this.players.push({
        name: req.nickname,
        socket: req.socketId,
        team: req.team,
        role: req.role,
      });
      io.sockets.connected[req.socketId].join(this.id);
      this.updateClients();
    }

    return error;
  }

  /**
   * make a simplified version of the game object to send to the client
   * @return {Object} - Stripped version of the game object
   */
  makeClientCopy() {
    let clientGame = {
      teams: this.teams,
      usedWords: this.usedWords,
      board: (() => {
        let cards = [];
        this.board.forEach((card, i) => {
          let newCard = {
            word: card.word,
            team: (() => {
              if (card.revealed) {
                return card.team;
              }
            })(),
          };
          cards.push(newCard);
        });
        return cards;
      })(),
      players: this.players,
      id: this.id,
    };
    console.log(`Sending client game`);

    return clientGame;
  }

  /**
   * Make a game object for a spymaster
   * @return {Object} - stripped version of the game object
   */
  makeSpymasterCopy() {
    let clientGame = (({id, players, board, teams}) => ({
      id,
      players,
      board,
      teams,
    }))(this);
    console.log('Sending Spymaster game');
    return clientGame;
  }

  /**
   * update the client versions of the game
   */
  updateClients() {
    for (let player of this.players) {
      if (player.role === 'spymaster') {
        io.to(player.socket).emit('game update', this.makeSpymasterCopy());
      } else {
        io.to(player.socket).emit('game update', this.makeClientCopy());
      }
    }
  }
}

/**
 * Clue card
 */
class Card {
  /**
   * @param {string} word
   * @param {string} team
   */
  constructor(word, team) {
    this.team = team;
    this.word = word || getRandomWord();
  }
}

/**
 * fetch the list of words to use
 */
function loadWordList() {
  fs.readFile(__dirname + '/assets/words.txt', 'utf8', (err, data) => {
    if (err) {
      console.log('an error has occured while loading the word list: ' + err);
      return;
    }
    let words = data.split('\n');
    wordList = words;
  });
}

/**
 * Pull a random word from the word list
 * @return {string} - the selected word
 */
function getRandomWord() {
  let word = wordList[Math.floor(Math.random() * wordList.length)];
  return word;
}

/**
 * Shuffles array in place.
 * @param {Array} a - items An array containing the items.
 * @return {Array} - shuffled array
 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Search through the list of games to see if one exists with a given id
 * @param {String} id - id of the game to find
 * @return {Game}
 */
function findGame(id) {
  let result;
  games.forEach((game) => {
    if (game.id == id.toLowerCase()) {
      result = game;
      return;
    }
  });
  return result;
}
