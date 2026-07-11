const http = require('https');
http.get('https://outpost-app.onrender.com/api/messages/1_1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const msgs = JSON.parse(data);
      console.log('Total:', msgs.length);
      const nonText = msgs.filter(m => m.type !== 'text' && m.type !== undefined);
      console.log('Non-text:', nonText.length);
      if (nonText.length) console.log(JSON.stringify(nonText.slice(-2), null, 2));
    } catch(e) { console.error('Parse error'); }
  });
});
