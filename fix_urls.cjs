const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      content = content.replace(/\(import\.meta\.env\.VITE_CORE_API_URL \|\| 'http:\/\/localhost:5002'\)/g, 
        "(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))");
        
      content = content.replace(/\(import\.meta\.env\.VITE_CHAT_URL \|\| 'http:\/\/localhost:5003'\)/g, 
        "(import.meta.env.VITE_CHAT_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5003'))");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInFiles('./src');
