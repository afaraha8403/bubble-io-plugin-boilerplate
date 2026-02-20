let box = $('<div style="text-align: center;"></div>');
instance.canvas.append(box);
box.css('background-image', 'url(//dd7tel2830j4w.cloudfront.net/f1571873642157x723550619524317900/google-map-ext-backdrop.svg)');
box.css('background-repeat', 'repeat');
box.css('background-size', '48px 48px');
box.css('background-position', 'top');
box.css('padding', 0);
box.css('height', properties.bubble.height - 0);
box.css('width', properties.bubble.width - 0);

if (instance.isResponsive) {
  instance.setHeight(properties.bubble.width);
}
