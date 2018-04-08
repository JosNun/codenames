const fs = require('fs');

const WORDS_FILE = `${__dirname}/../assets/words.txt`;

let wordList;

/**
 * fetch the list of words to use
 */
function loadWordList() {
  fs.readFile(WORDS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error(`an error has occured while loading the word list: ${err}`);
      return;
    }
    const words = data.split('\n');
    wordList = words;
  });
}

/**
 * Pull a random word from the word list
 * @return {string} - the selected word
 */
function getRandomWord() {
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  return word;
}

function getWordList() {
  return wordList;
}

module.exports = {
  loadWordList,
  getRandomWord,
  getWordList,
  wordList,
};
