// Build the full UI HTML and mount it into root.
export function renderShell(root) {
  root.innerHTML = `
    <header>
      <h1>format-json-llm</h1>
      <p>Convert JSON ↔ TOON and generate schemas (JSON Schema + TOON schema) for LLMs</p>
    </header>
    <div class="controls">
      <label>Source:
        <select id="source">
          <option value="json">JSON</option>
          <option value="toon">TOON</option>
        </select>
      </label>
      <label>Delimiter:
        <select id="delimiter">
          <option value="comma">,</option>
          <option value="tab">tab</option>
          <option value="pipe">|</option>
        </select>
      </label>
      <label>Indent: <input id="indent" type="number" min="0" max="8" value="2" style="width:48px" /></label>
      <label><input id="strict" type="checkbox" checked /> strict</label>
      <label><input id="keyFolding" type="checkbox" /> keyFolding</label>
      <button id="swap">⇄ Swap source</button>
    </div>
    <div class="workspace">
      <div class="panel">
        <div class="panel-head"><span id="inputLabel">Input (JSON)</span></div>
        <textarea id="input" aria-labelledby="inputLabel" placeholder="Paste JSON or TOON here..." spellcheck="false"></textarea>
        <div class="error" id="inputError"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div class="tabs">
            <button data-tab="convert" class="active">Convert</button>
            <button data-tab="jsonschema">JSON Schema</button>
            <button data-tab="toonschema">TOON Schema</button>
          </div>
          <button class="copy-btn" id="copyOut">Copy</button>
        </div>
        <pre class="output" id="output" aria-label="Output" tabindex="0"></pre>
        <div class="error" id="outputError"></div>
      </div>
    </div>
    <div class="tokenbar">
      <span>JSON: <strong id="jsonTokens">0</strong> tokens</span>
      <span>TOON: <strong id="toonTokens">0</strong> tokens</span>
      <span>Saved: <strong id="savedPercent">0%</strong></span>
      <a class="repo-link" href="https://github.com/lugondev/format-json-llm" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
    </div>
  `;
}

export function setOutput(root, text) {
  root.querySelector('#output').textContent = text;
}

export function setError(root, id, message) {
  root.querySelector(`#${id}`).textContent = message || '';
}

export function setTokens(root, { jsonTokens, toonTokens, savedPercent }) {
  root.querySelector('#jsonTokens').textContent = jsonTokens;
  root.querySelector('#toonTokens').textContent = toonTokens;
  root.querySelector('#savedPercent').textContent = `${savedPercent}%`;
}
