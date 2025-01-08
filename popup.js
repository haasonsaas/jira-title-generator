let currentTitle = '';

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHistory();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('regenerateBtn').addEventListener('click', regenerateTitle);
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  
  ['template', 'format', 'maxLength'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveSettings);
  });
}

async function loadSettings() {
  const settings = await chrome.storage.local.get(['template', 'format', 'maxLength']);
  if (settings.template) document.getElementById('template').value = settings.template;
  if (settings.format) document.getElementById('format').value = settings.format;
  if (settings.maxLength) document.getElementById('maxLength').value = settings.maxLength;
}

async function saveSettings() {
  const settings = {
    template: document.getElementById('template').value,
    format: document.getElementById('format').value,
    maxLength: document.getElementById('maxLength').value
  };
  await chrome.storage.local.set(settings);
}

async function loadHistory() {
  const { history = [] } = await chrome.storage.local.get(['history']);
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  history.slice(0, 10).forEach(title => {
    const li = document.createElement('li');
    li.textContent = title;
    li.addEventListener('click', () => {
      document.getElementById('generatedTitle').textContent = title;
      currentTitle = title;
      updateButtons(true);
    });
    historyList.appendChild(li);
  });
}

async function regenerateTitle() {
  const { selectedText } = await chrome.storage.local.get(['selectedText']);
  if (!selectedText) return;
  
  await generateTitle(selectedText);
}

async function generateTitle(text) {
  const settings = await chrome.storage.local.get(['template', 'format', 'maxLength']);
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateTitle',
      text,
      template: settings.template,
      format: settings.format,
      maxLength: settings.maxLength
    });

    if (response.error) {
      document.getElementById('generatedTitle').textContent = `Error: ${response.error}`;
      updateButtons(false);
      return;
    }

    currentTitle = response.title;
    document.getElementById('generatedTitle').textContent = currentTitle;
    updateButtons(true);
    await addToHistory(currentTitle);
  } catch (error) {
    document.getElementById('generatedTitle').textContent = `Error: ${error.message}`;
    updateButtons(false);
  }
}

async function addToHistory(title) {
  const { history = [] } = await chrome.storage.local.get(['history']);
  const newHistory = [title, ...history.filter(t => t !== title)].slice(0, 10);
  await chrome.storage.local.set({ history: newHistory });
  await loadHistory();
}

function updateButtons(enabled) {
  document.getElementById('regenerateBtn').disabled = !enabled;
  document.getElementById('copyBtn').disabled = !enabled;
}

async function copyToClipboard() {
  await navigator.clipboard.writeText(currentTitle);
  const copyBtn = document.getElementById('copyBtn');
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = 'Copy to Clipboard';
  }, 1500);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateTitle') {
    generateTitle(request.text);
  }
});
