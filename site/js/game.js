let gameInfo = {};

socket.on('turn update', (newTurn, game) => {
  console.log('turn update recieved');
  gameInfo.currentTurn = newTurn;
  turnController.updateUi();
});

/**
 * setup the site for the game view
 */
function init() {
  console.log('initializing game');
  console.log(currentGame);

  let gameBoard = document.querySelector('.game-board');
  gameBoard.style.display = 'grid';

  document.querySelector('.game-status').classList.add('show-desktop');

  currentGame.board.forEach((card) => {
    let div = document.createElement('div');
    div.classList.add('card');
    div.innerText = card.word;
    if (card.revealed || (gameInfo.role === 'detective' && card.team)) {
      div.classList.add(`revealed-${card.team}`);
      div.classList.add(`team-${card.team}`);
    }
    if (
      gameInfo.role !== 'spymaster' &&
      gameInfo.currentTurn === gameInfo.team
    ) {
      div.addEventListener('click', guessCard);
    } else {
      div.classList.add('disabled');
    }
    gameBoard.appendChild(div);
  });

  socket.on('game update', (newGame) => {
    updateGameUi(newGame);
    updateStatusUi(newGame);
  });
}

let updateGameUi = function(gameUpdate) {
  let gameBoard = document.querySelector('.game-board');
  gameUpdate.board.forEach((card, i) => {
    let cardEl = gameBoard.children[i];
    if (gameInfo.role === 'spymaster') {
      cardEl.classList.add(`team-${card.team}`);
      cardEl.removeEventListener('click', guessCard);
    }
    if (card.revealed || (gameInfo.role === 'detective' && card.team)) {
      cardEl.classList.add(`revealed-${card.team}`);
      cardEl.classList.add(`team-${card.team}`);
      cardEl.removeEventListener('click', guessCard);
    }
  });
};

/**
 * handle sending a guess to the server when a card is clicked
 * @param {*} e event object
 */
function guessCard(e) {
  socket.emit('card guess', currentGame.id, e.target.innerText);
}
