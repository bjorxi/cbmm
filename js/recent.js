const STORAGE_RECENT_FOLDERS_KEY = "recentFolders";
const MAX_RECENT_FOLDERS = 5;

document
  .querySelector("div#recent-folders")
  .addEventListener("click", (event) => {
    console.log("event.srcElement.tagName", event.srcElement.tagName);
    if (event.srcElement.tagName === "INPUT") {
      return;
    }
    const selectedFolder = document.querySelector(
      "div.bookmark-folder-selected"
    );

    if (selectedFolder) {
      selectedFolder.classList.remove("bookmark-folder-selected");
    }

    console.log("div#recent-folders::click event", event);
    const element = event.srcElement;

    element.classList.add("bookmark-folder-selected");
  });

const showRecentFolders = () => {
  const container = document.querySelector("div#recent-folders");
  const tabInput = document.querySelector("input#tab-folder");
  let tabInputSet = false;

  getRecentFolders((folders) => {
    console.log("showRecentFolders::folders", folders);
    if (typeof folders === "undefined" || folders.length === 0) {
      container.remove();
      return;
    }

    for (const folder of folders.reverse()) {
      if (folder.name === undefined || folder.name === null || folder.name.length === 0) {
        continue;
      }

      if (!tabInputSet) {
        tabInput.value = folder.name;
        tabInputSet = true;
      }
      const newDiv = document.createElement("div");
      newDiv.innerText = folder.name;
      newDiv.setAttribute("data-id", folder.id);
      newDiv.setAttribute("data-paret-id", folder.parentId);
      newDiv.classList.add("bookmark-folder");
      container.appendChild(newDiv);
    }
  });
};

const updateRecentsArray = (recents, folder) => {
  console.log("updateRecentsArray", recents, folder);
  // added code - recents.length &&
  if (recents.length && folder.name === recents.at(-1).name) {
    console.log("Last saved folder is the same");
    return;
  }

  n = recents.length;

  // check if the folder is already in the list, then move it's to the last position
  for (let i = 0; i < n; i++) {
    if (recents[i].name === folder.name) {
      console.log("Swapping", i);
      recents[i] = recents[n - 1];
      recents[n - 1] = folder;
      return;
    }
  }

  recents.push(folder);

  if (recents.length > MAX_RECENT_FOLDERS) {
    recents.shift();
  }
};

const saveRecentFolders = (folder, cb) => {
  const save = (recents) => {
    console.log("Recent folders", recents);
    if (typeof recents === "undefined") {
      console.log("No recent folders has been found, initializing the list");
      recents = [folder];
    } else {
      updateRecentsArray(recents, folder);
    }
    console.log("Saving recent folder", { recentFolders: recents });
    chrome.storage.local.set({ recentFolders: recents }).then(() => {
      if (cb) {
        cb();
      }
      console.log("Recent folders list has been updated");
    });
  };
  getRecentFolders(save);
};

const getRecentFolders = (callback) => {
  chrome.storage.local.get("recentFolders").then((result) => {
    console.log(
      `getRecentFolders(${"recentFolders"})`,
      result["recentFolders"]
    );

    // added code start
    let folderList = [];
    result["recentFolders"].find((folder) => {
      for (let [key, value] of BMT.map) {
        if (key === folder.id) {
          folderList.push(folder);
        }
      }
    });

    if (folderList.length !== result["recentFolders"].length) {
      console.log("storage is update: ", folderList);
      chrome.storage.local.set({ recentFolders: folderList });
    }
    // added code finish

    if (callback) {
      // change callback parameter

      // callback(result["recentFolders"]);
      callback(folderList);
    }
  });
};
