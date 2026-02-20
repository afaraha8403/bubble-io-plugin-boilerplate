let update = function(instance, properties, context) {
  /**
   * @description Runs on every property change and after data loads.
   *
   * @param {object} instance   - Bubble element instance (canvas, data, publishState, triggerEvent)
   * @param {object} properties - Current field values from the Bubble editor.
   * @param {object} context    - Bubble context (keys, currentUser, etc.)
   */

  // if (properties.verbose_logging) {
  //   console.log('[PLUGIN_PREFIX] update called', { properties });
  // }

  // === DATA LOADING ===
  var dataSource = properties.data_source;
  // var count = dataSource.length();
  // var items = dataSource.get(0, Math.min(count, 50));

  // if (properties.verbose_logging) {
  //   console.log('[PLUGIN_PREFIX] data loaded', { dataSource });
  // }

  // === GUARD ===
  if (!instance.data.isReady) {
    // if (window.MyLib) { instance.data.isReady = true; }
    // else { return; }
  }

  // === CHANGE DETECTION ===
  var newData = JSON.stringify(properties);
  if (instance.data.lastProps === newData) return;
  instance.data.lastProps = newData;

  // === CLEANUP ===
  var ns = '.' + instance.data.uid;
  instance.canvas.off('click' + ns);

  // === RENDER ===
  try {
    var container = instance.data.container;
    container.empty();

    // ... rendering logic ...

    // instance.canvas.on('click' + ns, '.PLUGIN_PREFIX-item', function() {
    //   instance.publishState('selected_item', $(this).data('id'));
    //   instance.triggerEvent('item_clicked');
    // });

  } catch (e) {
    if (e.message === 'not ready') throw e;
    console.error('[PLUGIN_PREFIX] update error:', e);
    instance.publishState('error_message', e.message);
  }

};
