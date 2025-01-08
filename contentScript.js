// This script runs in the context of web pages
// It's currently minimal as we're using the context menu API
// but could be expanded to add more interactive features

document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.storage.local.set({ selectedText });
  }
});
