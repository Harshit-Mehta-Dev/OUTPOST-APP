const http = require('https');
http.get('https://outpost-app.onrender.com/api/messages/all', (res) => { // WAIT, is there an "all" endpoint? No.
  console.log("No all endpoint");
});
