import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('mobile settings use the page scroll and keep drawer controls reachable',async()=>{
 const css=await readFile(new URL('../public/cabinet.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:672px\)\{aside\{max-height:none;overflow:visible\}\}/);
 const html=await readFile(new URL('../public/cabinet.html',import.meta.url),'utf8');
 assert.match(html,/width=device-width,initial-scale=1/);
});
