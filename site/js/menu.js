/*
TODO:
[X] for finding games, show a list of games that already  (input list attribute)
[X] Display the current teams, and who is on them
[ ] Clean up everything, and reorder it
*/

let gameNameBox = document.querySelector('.game-name-textbox');
let createGameBtn = document.querySelector('.create-game-btn');

let currentGame;

let gameQuery = debounce((e) => {
  socket.emit('game query', socket.id, e.target.value);
}, 250);

addListenerAsync(gameQuery, gameNameBox, 'input');
addListenerAsync(updateGamesList, gameNameBox, 'focus');
addListenerAsync(
  () => {
    let gameName = gameNameBox.value;
    if (gameLogin.gameExists) {
      requestGameJoin(gameName);
    } else {
      socket.emit('create game', gameName);
      socket.emit('game query', socket.id, gameName);
    }
  },
  createGameBtn,
  'click'
);

/**
 * request that the server add us to a game
 * @param {String} gameName - the name/id of the game to join
 */
function requestGameJoin(gameName) {
  let name = document.querySelector('#nickname-input').value;
  let team = document.querySelector('input[name="team"]:checked').value;
  let role = document.querySelector('input[name="role"]:checked').value;

  let request = {
    gameId: gameName,
    socketId: socket.id,
    nickname: name,
    team: team,
    role: role,
  };

  gameInfo.role = role;
  gameInfo.room = gameName;
  gameInfo.playerName = name;
  gameInfo.team = team;

  socket.emit('join game', request);
}

// When we get information about a game
socket.on('game query response', (msg) => {
  console.log('game query recieved');
  if (msg) {
    currentGame = msg;
    updateGamesList(msg);
    gameLogin.update(currentGame);
    gameLogin.show();
  } else {
    createGameBtn.textContent = 'Create Game';
    gameLogin.gameExists = false;
    gameLogin.hide();
  }
});

// When the server lets us know that we have been added to a game
socket.on('game join response', (success, error) => {
  if (success) {
    document.querySelector('.game-setup-container').style.transform =
      'translateY(-100%) scaleY(0)';
    init();
    socket.emit('request game update', socket.id, gameInfo.room);
    console.log('Game successfully joined');
  } else {
    console.log('Error joining game: ' + error);
  }
});

// When the server pushes new game data
socket.on('game update', (game) => {
  console.log('game update recieved');
  currentGame = game;
  gameLogin.update(currentGame);
});

/**
 * Update the list of games that exist on the server
 * @param {Array} games - An array of game names
 */
function updateGamesList(games) {
  socket.emit('games list request', (games) => {
    let gamesList = document.getElementById('games-list');
    while (gamesList.firstChild) {
      gamesList.removeChild(gamesList.firstChild);
    }

    games.forEach((game) => {
      let opt = document.createElement('option');
      opt.setAttribute('value', game);
      gamesList.appendChild(opt);
    });
  });
}

/**
 * Gets the amount of players on a team if color supplied, or total players
 * @param {*} game - The game object to be searched for players
 * @param {*} color - The team to search for
 * @return {number} The amount of players
 */
function getPlayerAmount(game, color) {
  if (color) {
    return game.players.reduce((acc, player) => {
      if (player.team === color) {
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);
  } else {
    return game.length;
  }
}

/**
 * Check of the given team has a spymaster already
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

/**
 * Check to see if a game has players
 * @param {*} playerName - Player name to check
 * @param {*} game - Game to search for players
 * @return {boolean} True if the game has the player, else false
 */
function gameHasPlayer(playerName, game) {
  game = game || currentGame;
  let playerExists = false;

  game.players.forEach((player) => {
    if (player.name.toLowerCase() === playerName.toLowerCase()) {
      playerExists = true;
    }
  });

  return playerExists;
}

let gameLogin = {
  container: document.querySelector('.join-game-setup'),
  nameBox: document.getElementById('nickname-input'),
  nameBoxSpan: document.querySelector('#nickname-input + span'),
  blueTeamRadio: document.getElementById('blue-team-radio'),
  redTeamRadio: document.getElementById('red-team-radio'),
  detectiveRadio: document.getElementById('role-detective-radio'),
  spymasterRadio: document.getElementById('role-spymaster-radio'),

  gameExists: false,
  hide: function() {
    this.container.style.height = '0';
  },
  show: function() {
    this.container.style.height = this.container.scrollHeight;
  },
  update: function(game) {
    game = game || currentGame;
    let team;
    let playerName = this.nameBox.value;
    let teamRadio = document.querySelector('input[name="team"]:checked');
    if (teamRadio) {
      team = teamRadio.value;
    }

    createGameBtn.textContent = 'Join Game';
    this.gameExists = true;

    if (gameHasPlayer(playerName)) {
      this.nameBox.classList.add('invalid');
      // this.nameBoxSpan.setAttribute('data-sub', 'Name already taken!');
      createGameBtn.setAttribute('disabled', '');
    } else {
      this.nameBox.classList.remove('invalid');
      // this.nameBoxSpan.setAttribute('data-sub', '');
      createGameBtn.removeAttribute('disabled');
    }

    gameLogin.blueTeamRadio.labels[0].setAttribute(
      'data-sub',
      getPlayerAmount(game, 'blue') + ' players'
    );
    this.redTeamRadio.labels[0].setAttribute(
      'data-sub',
      getPlayerAmount(game, 'red') + ' players'
    );

    if (team) {
      if (teamHasSpymaster(team, game.players)) {
        this.spymasterRadio.labels[0].setAttribute(
          'data-sub',
          'Team has spymaster'
        );
        this.spymasterRadio.setAttribute('disabled', '');
        this.detectiveRadio.checked = true;
      } else {
        this.spymasterRadio.labels[0].setAttribute('data-sub', '');
        this.spymasterRadio.removeAttribute('disabled');
      }
    }
  },
};

document.querySelectorAll('.join-game-setup input').forEach((el) => {
  if (el.type === 'text') {
    el.addEventListener('input', (e) => {
      gameLogin.update(currentGame);
    });
  } else if (el.type === 'radio') {
    el.addEventListener('click', (e) => {
      gameLogin.update(currentGame);
    });
  }
});

updateGamesList();
