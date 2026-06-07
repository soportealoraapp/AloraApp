const fs = require('fs');
const content = fs.readFileSync('src/lib/compatibility/quizzes.ts', 'utf-8');

const match = content.match(/COMPATIBILITY_QUIZZES:\s*Quiz\[\]\s*=\s*(\[[\s\S]*?\]);\s*\n\s*\n/s);
if (!match) { console.error('Could not extract QUIZZES data'); process.exit(1); }

let jsonData = match[1];
jsonData = jsonData.replace(/,(\s*[\]}])/g, '$1');
jsonData = jsonData.replace(/\/\/.*$/gm, '');

try {
    JSON.parse(jsonData);
    fs.writeFileSync('src/data/quizzes.json', jsonData);
    console.log('Written src/data/quizzes.json (' + (jsonData.match(/\n/g)||[]).length + ' lines)');
} catch(e) {
    console.error('JSON parse error:', e.message);
    const lines = jsonData.split('\n');
    const errMatch = e.message.match(/position\s+(\d+)/);
    if (errMatch) {
        const pos = parseInt(errMatch[1]);
        const lineNum = jsonData.substring(0, pos).split('\n').length;
        console.error('Around line', lineNum, ':', lines[Math.max(0,lineNum-3)], '|', lines[Math.max(0,lineNum-2)], '|', lines[Math.max(0,lineNum-1)]);
    }
    process.exit(1);
}
