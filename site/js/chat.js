const chatContainer = document.querySelector('.chat-box');
const chatbox = document.querySelector('.message-box');
const chatForm = document.querySelector('.chat-form');
const chatSendBtn = document.querySelector('.chat-send-btn');
const chatList = document.querySelector('.chat-messages');

socket.on('chat message', (payload, isLocal) => {
  if (!isLocal && !chatContainer.classList.contains('show')) {
    showChatIndicator('show');
  }
  addChatMessage(payload, isLocal);
});

/**
 * Send a chat message
 * @param {Event} e  - event object
 * @return {boolean}
 */
function sendChat(e) {
  // console.log('sending chat');
  e.preventDefault();

  const payload = {
    message: chatbox.value,
    room: gameInfo.room.toLowerCase() || 'global',
    name: gameInfo.playerName || 'Anonymous',
    team: gameInfo.team,
  };
  chatbox.value = '';
  chatSendBtn.style.transform = 'rotate(0deg)';
  // console.log(`Submitting chat message: ${payload.message}`);
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
  // console.log('chat recieved');
  // console.log(payload);

  if (
    (payload.room === 'global' && !gameInfo.room) ||
    payload.room === gameInfo.room
  ) {
    const div = document.createElement('div');
    div.innerText = payload.message;
    div.classList.add('chat-message');

    if (isLocal) {
      div.classList.add('chat-local');
    } else {
      const author = document.createElement('div');
      author.innerText = payload.name;
      author.classList.add('chat-author');
      if (payload.team === 'blue') {
        author.classList.add('blue');
      } else if (payload.team === 'red') {
        author.classList.add('red');
      }

      div.appendChild(author);
    }

    chatList.appendChild(div);

    chatList.scrollTop = chatList.scrollHeight;
  }
}

function showChatIndicator() {
  const indicator = document.querySelector('.chat-indicator');
  indicator.classList.remove('hidden');
}

function hideChatIndicator() {
  const indicator = document.querySelector('.chat-indicator');
  indicator.classList.add('hidden');
}

chatbox.addEventListener(
  'input',
  debounce(e => {
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
