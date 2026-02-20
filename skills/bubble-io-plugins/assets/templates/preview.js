/**
 * @description Preview placeholder for the Bubble Editor canvas.
 *
 * @param {object} instance   - Bubble editor element instance (canvas only)
 * @param {object} properties - Current field values from the Bubble editor
 */

var box = $('<div></div>');
box.css({
  'text-align':       'center',
  'display':          'flex',
  'align-items':      'center',
  'justify-content':  'center',
  'background-color': '#f0f0f0',
  'border':           '1px dashed #ccc',
  'color':            '#666',
  'font-size':        '14px'
});

instance.canvas.append(box);

box.css('height', properties.bubble.height() + 'px');
box.css('width', properties.bubble.width() + 'px');
box.text('PLUGIN_PREFIX Element');

if (instance.isResponsive) {
  instance.setHeight(properties.bubble.width());
}
