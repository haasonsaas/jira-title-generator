// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateJiraTitle',
    title: 'Generate JIRA Title',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'generateJiraTitle') {
    chrome.storage.local.set({ selectedText: info.selectionText });
    chrome.runtime.sendMessage({
      action: 'updateTitle',
      text: info.selectionText,
    });
  }
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action === 'generateTitle') {
    generateTitle(request).then(sendResponse).catch((error) => {
      sendResponse({ error: error.message });
    });
    return true; // Keeps the message channel open for async response
  }
});

async function generateTitle(request) {
  const { text, template, format, maxLength } = request;

  // Validate inputs
  if (!text || !template || !maxLength) {
    throw new Error('Missing required fields: text, template, or maxLength.');
  }

  const { apiKey } = await chrome.storage.local.get(['apiKey']);
  if (!apiKey) {
    throw new Error('OpenAI API key not set. Please configure it in the extension options.');
  }

  const templates = getTemplates(template);
  if (!templates) {
    throw new Error(`Invalid template type: ${template}`);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: buildSystemMessage(template, templates, maxLength),
          },
          { role: 'user', content: text },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate title');
    }

    const data = await response.json();
    const generatedTitle = JSON.parse(data.choices[0].message.content)?.title;

    return {
      title: formatTitle(generatedTitle, format, maxLength),
    };
  } catch (error) {
    throw new Error(`Error generating title: ${error.message}`);
  }
}

function getTemplates(template) {
  const templateInstructions = {
    story: 'Create a user story title that focuses on user benefit and action, emphasizing the value to the end user',
    bug: 'Create a bug report title that clearly states the issue, affected component, and impact',
    task: 'Create a task title that describes the specific technical action needed with clear deliverables',
    feature: 'Create a feature request title that emphasizes new functionality and its purpose',
    techDebt: 'Create a technical debt title focusing on refactoring, cleanup, or architectural improvements',
    security: 'Create a security-focused title that emphasizes the protective action and threat being addressed',
    performance: 'Create a performance optimization title that highlights the component and metric being improved',
    documentation: 'Create a documentation task title that specifies what needs to be documented and why',
    testing: 'Create a testing task title that outlines the scope and scenario being tested',
  };

  const templateExamples = {
    story: '"As a mobile user, I want to save articles offline"',
    bug: '"Fix: Login timeout on slow connections"',
    task: '"Implement Redis caching for API responses"',
    feature: '"Add dark mode support for web interface"',
    techDebt: '"Refactor: Authentication service for better maintainability"',
    security: '"Security: Implement rate limiting for API endpoints"',
    performance: '"Optimize: Database queries for faster search results"',
    documentation: '"Document: API authentication process for developers"',
    testing: '"Test: Payment workflow for international transactions"',
  };

  return {
    instructions: templateInstructions[template],
    example: templateExamples[template],
  };
}

function buildSystemMessage(template, templates, maxLength) {
  return `
    You are a JIRA ticket title generator. Your task is to generate a concise, clear, and specific title based on the provided text.
    Follow these guidelines:
    1. Keep titles actionable and specific.
    2. Focus on the core issue or feature.
    3. Use clear, professional language.
    4. Avoid technical jargon unless necessary.
    5. Include key context but remain concise.

    Template type: ${template}
    ${templates.instructions}
    Example format: ${templates.example}

    Response format: JSON with a single 'title' field.
    Maximum length: ${maxLength} characters.
  `;
}

function formatTitle(title, format, maxLength) {
  if (!title) {
    return '';
  }

  let formattedTitle = title;
  switch (format) {
    case 'sentence':
      formattedTitle = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      break;
    case 'title':
      formattedTitle = title
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      break;
    case 'lowercase':
      formattedTitle = title.toLowerCase();
      break;
  }

  return formattedTitle.slice(0, maxLength);
}
