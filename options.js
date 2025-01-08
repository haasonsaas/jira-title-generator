document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('saveBtn').addEventListener('click', saveSettings);

const defaultTemplates = {
  'story-template': 'As a user, I want to {action} so that {benefit}',
  'bug-template': 'Fix: {issue} in {component}',
  'task-template': '{action} {object}',
  'feature-template': 'Add ability to {feature}',
  'tech-debt-template': 'Refactor: {component} to improve {aspect}',
  'security-template': 'Security: {action} to prevent {vulnerability}',
  'performance-template': 'Optimize: {component} for better {metric}',
  'documentation-template': 'Document: {component} {aspect}',
  'testing-template': 'Test: {scope} for {scenario}'
};

async function loadSettings() {
  const settings = await chrome.storage.local.get(['apiKey', ...Object.keys(defaultTemplates)]);

  if (settings.apiKey) {
    document.getElementById('apiKey').value = settings.apiKey;
  }

  Object.keys(defaultTemplates).forEach(templateId => {
    document.getElementById(templateId).value = settings[templateId] || defaultTemplates[templateId];
  });
}

async function saveSettings() {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey) {
    showStatus('API key is required', 'error');
    return;
  }

  const settings = {
    apiKey,
    ...Object.keys(defaultTemplates).reduce((acc, templateId) => ({
      ...acc,
      [templateId]: document.getElementById(templateId).value.trim()
    }), {})
  };

  try {
    await chrome.storage.local.set(settings);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus(`Error saving settings: ${error.message}`, 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 3000);
}