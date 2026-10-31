// Prints the last assistant text blocks (reasoning/conclusions, not tool output) of an interrupted workflow agent transcript.
//   node tools/mine-transcript.mjs <agent-xxx.jsonl> [blocks=4] [maxChars=1400]
import fs from 'node:fs';

const [file, nBlocks = '4', maxChars = '1400'] = process.argv.slice(2);
const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
const texts = [];
let toolCalls = 0;
for (const line of lines) {
  let ev;
  try { ev = JSON.parse(line); } catch (e) { continue; }
  if (ev.type !== 'assistant' || !ev.message || !Array.isArray(ev.message.content)) continue;
  for (const c of ev.message.content) {
    if (c.type === 'tool_use') toolCalls++;
    if (c.type === 'text' && c.text && c.text.trim().length > 40) texts.push({ t: ev.timestamp, text: c.text.trim() });
  }
}
console.log(`# ${file.split(/[\\/]/).pop()}  events=${lines.length} toolCalls=${toolCalls} textBlocks=${texts.length}`);
for (const x of texts.slice(-Number(nBlocks))) console.log(`\n[${x.t}]\n${x.text.slice(0, Number(maxChars))}${x.text.length > Number(maxChars) ? ' …' : ''}`);
