// Bubble.io code starts below. Please ignore code above when adding to Bubble.io
let initialize = function(instance, context) {
  /**
   * @description One-time setup for the PLUGIN_PREFIX element.
   * NOTE: initialize does not receive properties — verbose_logging is unavailable here.
   *
   * @param {object} instance - Bubble element instance (canvas, data, publishState, triggerEvent)
   * @param {object} context  - Bubble context (keys, currentUser, etc.)
   */

  instance.data.isReady = false;

  instance.data.container = $('<div class="PLUGIN_PREFIX-root"></div>');
  instance.canvas.append(instance.data.container);

  instance.data.uid = 'PLUGIN_PREFIX_' + Math.random().toString(36).substr(2, 9);

  // instance.publishState('my_state', null);

};
