// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateJiraTitle',
    title: 'Generate JIRA Title',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'generateJiraTitle') {
    chrome.storage.local.set({ selectedText: info.selectionText });
    chrome.runtime.sendMessage({
      action: 'updateTitle',
      text: info.selectionText
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateTitle') {
    generateTitle(request).then(sendResponse);
    return true;
  }
});

async function generateTitle(request) {
  const { text, template, format, maxLength } = request;
  const settings = await chrome.storage.local.get(['apiKey']);

  if (!settings.apiKey) {
    return { error: 'OpenAI API key not set. Please configure it in the extension options.' };
  }

  try {
    const templateInstructions = {
      'story': 'Create a user story title that focuses on the user benefit and action',
      'bug': 'Create a bug report title that clearly states the issue and affected component',
      'task': 'Create a task title that describes the specific action needed',
      'feature': 'Create a feature request title that emphasizes new functionality'
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a JIRA ticket title generator. Your task is to generate a concise, clear, and specific title based on the provided text.
                     Follow these guidelines:
                     1. Keep titles actionable and specific
                     2. Focus on the core issue or feature
                     3. Use clear, professional language
                     4. Avoid technical jargon unless necessary
                     5. Include key context but remain concise

                     Template type: ${template}
                     ${templateInstructions[template]}

                     Response format: JSON with a single 'title' field
                     Maximum length: ${maxLength} characters`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate title');
    }

    const data = await response.json();
    const generatedTitle = JSON.parse(data.choices[0].message.content).title;

    return {
      title: formatTitle(generatedTitle, format, maxLength)
    };
  } catch (error) {
    return { error: error.message };
  }
}

function formatTitle(title, format, maxLength) {
  let formattedTitle = title;

  switch (format) {
    case 'sentence':
      formattedTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      break;
    case 'title':
      formattedTitle = title.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      break;
    case 'lowercase':
      formattedTitle = title.toLowerCase();
      break;
  }

  return formattedTitle.slice(0, maxLength);
}