import fs from 'node:fs';
import assert from 'node:assert/strict';
const words=JSON.parse(fs.readFileSync('listening-words.json','utf8'));
const hints=new Map(fs.readFileSync('listening-hints.tsv','utf8').trim().split(/\r?\n/).map(line=>line.split('\t')));
assert.equal(words.length,215);assert.equal(hints.size,215);
for(const w of words){const text=hints.get(w.word.toLowerCase());assert(text,`Missing memory for ${w.word}`);w.memory={type:'听力搭配与拼写',text};w.synonyms=''}
fs.writeFileSync('listening-words.json',JSON.stringify(words,null,2)+'\n');
console.log('215 listening cards now have individual listening/spelling memory hints.');
