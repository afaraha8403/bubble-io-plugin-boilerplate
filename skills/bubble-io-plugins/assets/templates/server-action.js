// Server-side action (Plugin API v4): runs on Bubble's Node.js server.
// Receives: properties, context. NO instance, NO DOM, NO jQuery.
// Must be async. Use await on .get(), .length(), context.v3.request().

async function(properties, context) {

  // -- Access plugin API keys --
  // var apiKey = context.keys['My API Key'];

  // -- Access data (v4: all return Promises) --
  // var list = properties.my_list;
  // var count = await list.length();
  // var items = await list.get(0, Math.min(count, 50));

  // -- Make external API call (prefer fetch over context.v3.request) --
  // var response = await fetch('https://api.example.com/data', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': 'Bearer ' + apiKey,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ key: 'value' })
  // });
  // var data = await response.json();

  // -- Use Node modules (add to package.json in Plugin Editor) --
  // var myModule = require('my-module');

  // -- Return data for subsequent workflow actions --
  // return { result_field: data.value };

}
