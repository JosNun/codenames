/**
 * Shuffles array in place.
 * @param {Array} a - items An array containing the items.
 * @return {Array} - shuffled array
 */
function shuffle(array) {
  const arr = array;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = {
  shuffle,
};
