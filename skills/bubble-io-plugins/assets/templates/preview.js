// preview.js — runs in the Bubble Editor only.
// Receives: instance, properties (NO context, NO instance.data).
// Keep it simple: static placeholder, no API calls, no heavy libraries.

var box = $('<div style="text-align: center; display: flex; align-items: center; justify-content: center;"></div>');
instance.canvas.append(box);

// Size to match the element's dimensions in the editor.
box.css('height', properties.bubble.height() + 'px');
box.css('width', properties.bubble.width() + 'px');
box.css('background-color', '#f0f0f0');
box.css('border', '1px dashed #ccc');
box.css('color', '#666');
box.css('font-size', '14px');

box.text('PLUGIN_PREFIX Element');

// Handle responsive elements.
if (instance.isResponsive) {
  instance.setHeight(properties.bubble.width());
}
