const viewToggles = document.querySelectorAll('.view-toggle');
const closeBtn = document.querySelector('.toggle-close');

viewToggles.forEach(el => {
  el.addEventListener('click', e => {
    let panel = e.currentTarget.dataset.target;
    panel = document.querySelector(panel);
    togglePanel(panel);
  });
});

closeBtn.addEventListener('click', e => {
  closePanels();
  toggleButtonSlide(false);
});

function togglePanel(panel) {
  if (panel.classList.contains('chat-box')) {
    console.log('hiding indicator');
    const chatIndicator = document.querySelector('.chat-indicator');
    chatIndicator.classList.add('hidden');
  }
  panel.classList.toggle('show');
  toggleButtonSlide();
}

function closePanels() {
  const panels = document.querySelectorAll('.panel');
  panels.forEach(el => {
    el.classList.remove('show');
  });
}

function toggleButtonSlide(close) {
  const buttons = document.querySelector('.view-toggles');
  const closeBtn = document.querySelector('.toggle-close');
  if (close) {
    buttons.classList.add('slid');
    closeBtn.classList.add('slid');
  } else {
    buttons.classList.toggle('slid');
    closeBtn.classList.toggle('slid');
  }
}
