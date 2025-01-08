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
      'story': 'Create a user story title that focuses on user benefit and action, emphasizing the value to the end user',
      'bug': 'Create a bug report title that clearly states the issue, affected component, and impact',
      'task': 'Create a task title that describes the specific technical action needed with clear deliverables',
      'feature': 'Create a feature request title that emphasizes new functionality and its purpose',
      'tech-debt': 'Create a technical debt title focusing on refactoring, cleanup, or architectural improvements',
      'security': 'Create a security-focused title that emphasizes the protective action and threat being addressed',
      'performance': 'Create a performance optimization title that highlights the component and metric being improved',
      'documentation': 'Create a documentation task title that specifies what needs to be documented and why',
      'testing': 'Create a testing task title that outlines the scope and scenario being tested'
    };

    const templateExamples = {
      'story': '"As a mobile user, I want to save articles offline"',
      'bug': '"Fix: Login timeout on slow connections"',
      'task': '"Implement Redis caching for API responses"',
      'feature': '"Add dark mode support for web interface"',
      'tech-debt': '"Refactor: Authentication service for better maintainability"',
      'security': '"Security: Implement rate limiting for API endpoints"',
      'performance': '"Optimize: Database queries for faster search results"',
      'documentation': '"Document: API authentication process for developers"',
      'testing': '"Test: Payment workflow for international transactions"'
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
                     Example format: ${templateExamples[template]}

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