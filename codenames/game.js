const utils = require('../utils');
const words = require('./words.js');
const Card = require('./card.js');

let io;

function setIo(socketIo) {
  io = socketIo;
}

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
    // games.push(this);
  }

  /**
   * generate a new game board
   */
  generateBoard() {
    // Choose which team goes first
    if (Math.random() >= 0.5) {
      this.teams.blue.cards += 1;
      this.teams.blue.isFirst = true;
      this.turn = 'blue';
    } else {
      this.teams.red.cards += 1;
      this.teams.red.isFirst = true;
      this.turn = 'red';
    }

    this.teams.blue.cardsRemaining = this.teams.blue.cards;
    this.teams.red.cardsRemaining = this.teams.red.cards;

    // Make the cards
    for (let i = 0; i < 25; i += 1) {
      let word = words.getRandomWord();
      let team;
      while (this.usedWords.includes(word)) {
        // console.log(word + ' is in used words list');
        word = words.getRandomWord();
      }

      if (this.teams.blue.cards > 0) {
        this.teams.blue.cards -= 1;
        team = 'blue';
      } else if (this.teams.red.cards > 0) {
        this.teams.red.cards -= 1;
        team = 'red';
      } else if (this.teams.assassin.cards > 0) {
        this.teams.assassin.cards -= 1;
        team = 'assassin';
      } else {
        this.teams.neutral.cards -= 1;
        team = 'neutral';
      }
      this.usedWords.push(word);

      const card = new Card(word, team);
      this.board.push(card);
    }

    // delete total cards amount (useless now anyway)
    Object.keys(this.teams).forEach(key => {
      delete this.teams[key].cards;
    });

    this.board = utils.shuffle(this.board);
  }

  /**
   * Add a player to the game
   * @param {string} req - the request object
   * @return {String} an error if there is one, otherwise an empty string
   */
  addPlayer(req, sockets) {
    let error;

    /**
     *
     * @param {String} team - Team of the joining player
     * @param {*} players - list of players to check
     * @return {boolean} If the array of players already has a spymaster already
     */
    function teamHasSpymaster(team, players) {
      return players.find(
        player => player.team === team && player.role === 'spymaster'
      );
    }

    function nameIsUsed(name) {
      return this.players.find(
        player => player.name.toLowerCase() === name.toLowerCase()
      );
    }

    this.players.forEach(() => {
      if (nameIsUsed(req.nickname)) {
        error = 'Player already joined';
      } else if (
        req.role === 'spymaster' &&
        teamHasSpymaster(req.team, this.players)
      ) {
        error = 'There is already a Spymaster';
      } else {
        error = '';
      }
    });

    if (!error) {
      this.players.push({
        name: req.nickname,
        socket: req.socketId,
        team: req.team,
        role: req.role,
      });
      sockets.connected[req.socketId].join(this.id);
      this.updateClients();
      this.turnUpdate(req.socketId);
    }

    return error;
  }

  /**
   * End a teams turn
   * @param {String} team - The team who's turn should be over
   */
  endTurn(team) {
    let newTurn;
    if (team.toLowerCase() === 'blue') {
      newTurn = 'red';
    } else if (team.toLowerCase() === 'red') {
      newTurn = 'blue';
    } else {
      console.log(`UH OH!!! Invalid turn end request recieved: ${team}`);
    }

    this.turn = newTurn;

    this.turnUpdate();
  }

  /**
   * make a simplified version of the game object to send to the client
   * @return {Object} - Stripped version of the game object
   */
  makeClientCopy() {
    const clientGame = {
      teams: this.teams,
      usedWords: this.usedWords,
      board: (() => {
        const cards = [];
        this.board.forEach(card => {
          const newCard = {
            word: card.word,
            team: (() => {
              if (card.revealed) {
                return card.team;
              }
              return null;
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
    const clientGame = (({ id, players, board, teams }) => ({
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
    this.players.forEach(player => {
      if (player.role === 'spymaster') {
        io.to(player.socket).emit('game update', this.makeSpymasterCopy());
      } else {
        io.to(player.socket).emit('game update', this.makeClientCopy());
      }
    });
  }

  /**
   * Send a turn update to players. If a player is specified, send only to that player
   * @param {Socket} socket - Socket of the client to update
   */
  turnUpdate(socket) {
    if (!socket) {
      this.players.forEach(player => {
        io.to(player.socket).emit('turn update', this.turn, this.id);
      });
    } else {
      io.to(socket).emit('turn update', this.turn, this.id);
    }
  }
}

module.exports = {
  Game,
  setIo,
};
