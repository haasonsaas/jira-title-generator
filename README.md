# JIRA Title Generator

## Overview

The JIRA Title Generator is a Chrome extension that helps users generate concise and clear JIRA ticket titles from highlighted text using OpenAI's API. It provides customizable templates for different types of JIRA tickets, such as user stories, bug reports, tasks, and feature requests.

## Features

- **Context Menu Integration**: Generate JIRA titles directly from the context menu by selecting text on any webpage.
- **Customizable Templates**: Define and customize templates for different types of JIRA tickets.
- **Title Formatting**: Choose from sentence case, title case, or lowercase formatting for generated titles.
- **History Tracking**: Keep track of the last 10 generated titles for easy reference.
- **OpenAI Integration**: Utilizes OpenAI's GPT-4o model to generate titles based on user input and templates.

## Installation

1. Clone the repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory where you cloned the repository.

## Usage

1. Highlight text on any webpage.
2. Right-click and select "Generate JIRA Title" from the context menu.
3. The generated title will appear in the extension's popup, where you can copy it to your clipboard or regenerate it if needed.

## Configuration

- **API Key**: Set your OpenAI API key in the options page of the extension.
- **Templates**: Customize the templates for different ticket types in the options page.

## Code Structure

- **background.js**: Handles context menu actions and communicates with the OpenAI API.
- **options.html**: Provides the UI for setting the API key and customizing templates.
- **options.js**: Manages loading and saving of settings in the options page.
- **popup.html**: The main UI for the extension where users can see and manage generated titles.
- **popup.js**: Handles user interactions in the popup, such as generating titles and managing history.
- **contentScript.js**: Captures selected text on web pages.

## Dependencies

- **OpenAI API**: The extension uses the OpenAI API to generate JIRA titles. Ensure you have an API key and the necessary permissions.

## License

This project is licensed under the MIT License.

## Author

Jonathan Haas
