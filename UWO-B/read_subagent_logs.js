const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/USER/.gemini/antigravity-ide/brain/98ff59be-802b-406b-9048-a0fe8074c4a9/.system_generated/logs/transcript_full.jsonl'),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (line.includes('capture_browser_console_logs')) {
    const data = JSON.parse(line);
    console.log("FOUND STEP:", data.step_index);
    console.log("TOOL CALLS/RESPONSE:", JSON.stringify(data.content || data.tool_calls || data, null, 2));
  }
});
