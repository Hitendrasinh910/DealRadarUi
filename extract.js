const fs = require('fs');
const content = fs.readFileSync('C:/Users/Acer/.gemini/antigravity/brain/94b8d79d-dda5-482a-bffc-a4f73a92931f/.system_generated/steps/128/content.md', 'utf8');
const regex = /"([^"]{50,})"/g;
let match;
const results = [];
while ((match = regex.exec(content)) !== null) {
    let str = match[1];
    if (!str.includes('<') && !str.includes('{') && str.includes(' ')) {
        results.push(str);
    }
}
fs.writeFileSync('chat_text.txt', results.join('\n\n'));
console.log('Extracted ' + results.length + ' strings.');
