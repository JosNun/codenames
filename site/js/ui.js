let viewToggles = document.querySelectorAll('.view-toggle');
let closeBtn = document.querySelector('.toggle-close');

viewToggles.forEach((el) => {
  el.addEventListener('click', (e) => {
    let panel = e.currentTarget.dataset.target;
    panel = document.querySelector(panel);
    togglePanel(panel);
  });
});

closeBtn.addEventListener('click', (e) => {
  closePanels();
  toggleButtonSlide(false);
});

function togglePanel(panel) {
  if (panel.classList.contains('chat-box')) {
    console.log('hiding indicator');
    let chatIndicator = document.querySelector('.chat-indicator');
    chatIndicator.classList.add('hidden');
  }
  panel.classList.toggle('show');
  toggleButtonSlide();
}

function closePanels() {
  let panels = document.querySelectorAll('.panel');
  panels.forEach((el) => {
    el.classList.remove('show');
  });
}

function toggleButtonSlide(close) {
  let buttons = document.querySelector('.view-toggles');
  let closeBtn = document.querySelector('.toggle-close');
  if (close) {
    buttons.classList.add('slid');
    closeBtn.classList.add('slid');
  } else {
    buttons.classList.toggle('slid');
    closeBtn.classList.toggle('slid');
  }
}
