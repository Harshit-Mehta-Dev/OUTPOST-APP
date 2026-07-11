const http = require('https');
http.get('https://outpost-app.onrender.com/api/campsites', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const campsites = JSON.parse(data);
      console.log('Campsites found:', campsites.length);
      if (campsites.length > 0) {
        console.log(JSON.stringify(campsites[0].channels, null, 2));
      }
    } catch(e) { console.error('Parse error', e); }
  });
});
