let chatbox = document.querySelector('.message-box');
let chatForm = document.querySelector('.chat-form');
let chatSendBtn = document.querySelector('.chat-send-btn');
let chatList = document.querySelector('.chat-messages');

socket.on('chat message', addChatMessage);

/**
 * Send a chat message
 * @param {Event} e  - event object
 */
function sendChat(e) {
  console.log('sending chat');
  e.preventDefault();

  let payload = {
    message: chatbox.value,
    room: gameInfo.room || 'global',
    name: gameInfo.playerName || 'Anonymous',
    team: gameInfo.team,
  };
  chatbox.value = '';
  chatSendBtn.style.transform = 'rotate(0deg)';
  console.log('Submitting chat message: ' + payload.message);
  socket.emit('chat message', payload);
  addChatMessage(payload, true);
  return false;
}

/**
 * Add a chat message to the chat room
 * @param {*} payload - an object containing the message, room, and name of the player who sent it
 * @param {boolean} isLocal - if the chat message came from the user
 */
function addChatMessage(payload, isLocal) {
  console.log('chat recieved');
  console.log(payload);

  if (
    (payload.room === 'global' && !gameInfo.room) ||
    payload.room === gameInfo.room
  ) {
    let div = document.createElement('div');
    div.innerText = payload.message;
    div.classList.add('chat-message');

    if (isLocal) {
      div.classList.add('chat-local');
    } else {
      let author = document.createElement('div');
      author.innerText = payload.name;
      author.classList.add('chat-author');
      if (payload.team === 'blue') {
        author.classList.add('blue-text');
      } else if (payload.team === 'red') {
        author.classList.add('red-text');
      }

      div.appendChild(author);
    }

    chatList.appendChild(div);

    chatList.scrollTop = chatList.scrollHeight;
  }
}

chatbox.addEventListener(
  'input',
  debounce((e) => {
    if (chatbox.value === '') {
      chatSendBtn.style.transform = 'rotate(0deg)';
    } else {
      chatSendBtn.style.transform = 'rotate(-90deg)';
    }
  }),
  250,
  true
);
chatForm.addEventListener('submit', sendChat);
