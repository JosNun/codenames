let blueRemainingEl = document.querySelector('.blue-cards-remaining');
let redRemainingEl = document.querySelector('.red-cards-remaining');
let bluePlayerList = document.querySelector('.blue-player-list');
let redPlayerList = document.querySelector('.red-player-list');

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
    let name = player.name;
    let team = player.team;

    let li = document.createElement('li');
    li.innerText = name;

    if (player.role === 'spymaster') {
      li.classList.add('spymaster');
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
