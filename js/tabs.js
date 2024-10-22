let ACTIVE_TAB = {};

const getActiveTabInfo = () => {
  // Get current's tab information
  chrome.tabs.query({"active": true}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.hasOwnProperty("title") && !tab.hasOwnProperty("url")) {
        continue;
      }

      ACTIVE_TAB.title = tab.title;
      ACTIVE_TAB.url = tab.url;

      break;
    }

    document.querySelector("input#tab-title").value = ACTIVE_TAB.title;

    console.log("tabs", tabs);
  });
};
