let gameInfo = {};

/**
 * setup the site for the game view
 */
function init() {
  console.log('initializing game');
  console.log(currentGame);

  let gameBoard = document.querySelector('.game-board');
  gameBoard.style.display = 'grid';

  document.querySelector('.game-status').style.transform = 'translateX(0)';

  currentGame.board.forEach((card) => {
    let div = document.createElement('div');
    div.classList.add('card');
    div.innerText = card.word;
    if (card.revealed || (gameInfo.role === 'detective' && card.team)) {
      div.classList.add(`revealed-${card.team}`);
      div.classList.add(`team-${card.team}`);
    }
    if (gameInfo.role !== 'spymaster') {
      div.addEventListener('click', guessCard);
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
  console.log(
    `Event ${e} clicked. Sending alert for card ${e.target.innerText}`
  );
  console.log(currentGame);
  socket.emit('card guess', currentGame.id, e.target.innerText);
}
