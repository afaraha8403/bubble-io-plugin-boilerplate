// Bubble.io code starts below. Please ignore code above when adding to Bubble.io
let initialize = function(instance, context) {

  // -- Persistent data store (survives across update calls) --
  instance.data.isReady = false;

  // -- Create root DOM container with prefixed class --
  instance.data.container = $('<div class="PLUGIN_PREFIX-root"></div>');
  instance.canvas.append(instance.data.container);

  // -- Generate unique ID for event namespacing --
  instance.data.uid = 'PLUGIN_PREFIX_' + Math.random().toString(36).substr(2, 9);

  // -- (Optional) Initialize exposed states with defaults --
  // instance.publishState('my_state', null);

};
