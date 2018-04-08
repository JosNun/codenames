const words = require('./words');

/**
 * Clue card
 */
class Card {
  /**
   * @param {string} word
   * @param {string} team
   */
  constructor(word, team) {
    this.team = team;
    this.word = word || words.getRandomWord();
  }
}

module.exports = Card;
