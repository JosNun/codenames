const blueRemainingEl = document.querySelector('.blue-cards-remaining');
const redRemainingEl = document.querySelector('.red-cards-remaining');
const bluePlayerList = document.querySelector('.blue-player-list');
const redPlayerList = document.querySelector('.red-player-list');

const turnController = {
  indicator: document.querySelector('.turn-view'),
  button: document.querySelector('.end-turn-btn'),
  updateUi() {
    this.indicator.innerText = gameInfo.currentTurn;
    console.log(`updating UI for ${gameInfo.currentTurn} turn`);
    if (gameInfo.currentTurn === gameInfo.team) {
      this.enableButton();
      document.querySelectorAll('div.card').forEach((card, i) => {
        card.addEventListener('click', guessCard);
        card.classList.remove('disabled');
      });
    }
    if (gameInfo.currentTurn === 'blue') {
      this.indicator.classList.remove('red-bg');
      this.indicator.classList.add('blue-bg');
    } else if (gameInfo.currentTurn === 'red') {
      this.indicator.classList.remove('blue-bg');
      this.indicator.classList.add('red-bg');
    } else {
      console.log(`Game info holds invalid turn info: ${gameInfo.currentTurn}`);
    }

    if (gameInfo.currentTurn !== gameInfo.team) {
      turnController.disableCards();
      turnController.disableButton();
    }
  },
  enableButton() {
    this.button.classList.add('enabled');
    this.button.addEventListener('click', endTurn);
  },
  disableButton() {
    this.button.classList.remove('enabled');
    this.button.removeEventListener('click', endTurn);
  },
  disableCards() {
    document.querySelectorAll('div.card').forEach((card, i) => {
      card.removeEventListener('click', guessCard);
      card.classList.add('disabled');
    });
  },
};

/**
 * Update the status ui
 * @param {*} game - game object to pull the info from
 */
function updateStatusUi(game) {
  blueRemainingEl.innerText = game.teams.blue.cardsRemaining;
  redRemainingEl.innerText = game.teams.red.cardsRemaining;

  while (bluePlayerList.lastElementChild.tagName.toLowerCase() !== 'h3') {
    bluePlayerList.removeChild(bluePlayerList.lastElementChild);
  }

  while (redPlayerList.lastElementChild.tagName.toLowerCase() !== 'h3') {
    redPlayerList.removeChild(redPlayerList.lastElementChild);
  }

  game.players.forEach((player, i) => {
    const name = player.name;
    const team = player.team;

    const li = document.createElement('li');
    li.innerText = name;

    if (player.role === 'spymaster') {
      li.classList.add('spymaster');
    }
    if (name === gameInfo.playerName) {
      li.classList.add('player-name');
    }

    if (team === 'blue') {
      li.classList.add('blue');
      bluePlayerList.appendChild(li);
    } else if (team === 'red') {
      li.classList.add('red');
      redPlayerList.appendChild(li);
    }
  });
}

/**
 * Request that the server end a turn
 */
function endTurn() {
  console.log('ending turn...');
  socket.emit('end turn', gameInfo.team, gameInfo.room);
}

turnController.button.addEventListener('click', endTurn);
