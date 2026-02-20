let update = function(instance, properties, context) {

  // ============================================================
  // 1. LOAD ALL DATA FIRST — before any DOM mutations.
  //    Bubble may re-run this entire function if data is pending.
  //    Do NOT wrap data access in try/catch.
  // ============================================================
  var dataSource = properties.data_source;
  // var count = dataSource.length();
  // var items = dataSource.get(0, Math.min(count, 50));

  // ============================================================
  // 2. GUARD — skip if external library is not loaded yet.
  // ============================================================
  if (!instance.data.isReady) {
    // Check if library loaded (set by header.html onload callback)
    // if (window.MyLib) { instance.data.isReady = true; }
    // else { return; }
  }

  // ============================================================
  // 3. CHANGE DETECTION — skip re-render if nothing changed.
  // ============================================================
  var newData = JSON.stringify(properties);
  if (instance.data.lastProps === newData) return;
  instance.data.lastProps = newData;

  // ============================================================
  // 4. CLEAN UP previous listeners (namespaced).
  // ============================================================
  var ns = '.' + instance.data.uid;
  instance.canvas.off('click' + ns);

  // ============================================================
  // 5. RENDER — safe to modify DOM now.
  // ============================================================
  try {
    var container = instance.data.container;
    container.empty();

    // ... your rendering logic here ...

    // Re-attach namespaced event listeners
    // instance.canvas.on('click' + ns, '.PLUGIN_PREFIX-item', function() {
    //   instance.publishState('selected_item', $(this).data('id'));
    //   instance.triggerEvent('item_clicked');
    // });

  } catch (e) {
    console.error('PLUGIN_PREFIX update error:', e);
    instance.publishState('error_message', e.message);
  }

};
