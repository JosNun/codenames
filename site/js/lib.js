/** Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    let context = this;
    let args = arguments;
    let later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Add an event listener to an element
 * @param {function} func - function to attach
 * @param {Element} el - element to attach the listener to
 * @param {String} type - the type of listener
 */
function addListenerAsync(func, el, type) {
  if (typeof func === 'undefined') {
    setTimeout(() => {
      addListenerAsync(func, el);
    }, 50);
    return;
  } else {
    el.addEventListener(type, func);
  }
}
