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


class Tab {
  constructor(title, url, active) {
    this.title = title;
    this.url = url;
    this.actvie = active;
  }

  isValid() {
    return true; // TODO implement
  }
}


class TabsManager {
  constructor(tabs) {
    if (tabs === undefined || tabs === null)
      this.tabs = [];
    else
      this.tabs = tabs;
  }

  addTab (tab) {
    this.tabs.push(tab);
  }

  getActiveTab() {
    for (const tab of this.tabs) {
      if (tab.active === true)
        return tab
    }
  }

  /*
    * @param active bool - if true only active tab info is fetched
    * */
  static buildFromTabInfo(active) {
    const obj = new TabsManager();
    chrome.tabs.query({"active": active}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.hasOwnProperty("title") && !tab.hasOwnProperty("url")) {
          continue;
        }

        obj.addTab(new Tab(tab.title, tab.url, true));
      }

      // document.querySelector("input#tab-title").value = ACTIVE_TAB.title;
      //
      // console.log("tabs", tabs);
    });
  }
}
