const BASE_INDENT = 20; // indent in pixels
let ACTIVE_TAB = {};
const BODY = document.querySelector("body");

document.querySelector("input#filter").focus();

showRecentFolders();

document.querySelector("button#footer-btn-cancel").addEventListener("click", (event) => {
  window.close();
});

const buildBookmarksTree = (node, parent, level) => {
  if (!node.hasOwnProperty("children")) {
    return 0;
  }

  const folder = document.createElement("div");

  folder.classList.add("bookmark-folder");
  folder.classList.add(`level-${level}`);
  folder.setAttribute("style", `padding-left:${BASE_INDENT*level}px;`);
  folder.setAttribute("data-id", `${node.id}`);
  folder.setAttribute("data-parent-id", `${node.parentId}`);
  folder.setAttribute("data-level", `${level}`);
  // folder.innerText = node.title;
  folder.innerHTML = `<i class="fa-regular fa-folder"></i>${node.title}`

  parent.appendChild(folder);

  const divTreeContainer = document.createElement("div");
  divTreeContainer.classList.add("bookmark-tree-container");
  divTreeContainer.setAttribute("data-parent-id", node.id);
  parent.appendChild(divTreeContainer);

  for (const child of node.children) {
    buildBookmarksTree(child, divTreeContainer, level+1);
  }

  return 1;
};

// Fetch current bookmarks
chrome.bookmarks.getTree((nodes) => {
  console.log("nodes", nodes, typeof nodes);
  const divBookmarksTree = document.querySelector("div#bookmarks-tree");

  for (const child of nodes[0].children) {
    buildBookmarksTree(child, divBookmarksTree, 0);
  }

  divBookmarksTree.addEventListener("click", (event) => {
    console.log("event.srcElement.tagName", event.srcElement.tagName);
    if (event.srcElement.tagName === "INPUT") {
      return;
    }
    const selectedFolder = document.querySelector("div.bookmark-folder-selected");

    if (selectedFolder) {
      selectedFolder.classList.remove("bookmark-folder-selected");
    }

    console.log(event);
    const element = event.srcElement;

    element.classList.add("bookmark-folder-selected");
    document.querySelector("input#tab-folder").value = event.srcElement.innerText;
  });


});


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


// Show "Create a new folder" window
document.querySelector("button#footer-btn-new-folder").addEventListener("click", (event) => {
  const selectedFolder = document.querySelector("div.bookmark-folder-selected");

  if (!selectedFolder) {
    return;
  }

  selectedFolder.classList.remove("bookmark-folder-selected");

  const selectedFolderId = parseInt(selectedFolder.getAttribute("data-id"));
  const selectedFolderLevel = parseInt(selectedFolder.getAttribute("data-level"));
  const parentDiv = document.querySelector(`div[data-parent-id="${selectedFolderId}"]`);

  const newDiv = document.createElement("div"),
        divLevel = selectedFolderLevel+1;

  newDiv.classList.add("bookmark-folder-selected");
  newDiv.setAttribute("style", `padding-left: ${BASE_INDENT*divLevel}`);
  newDiv.setAttribute("data-parent-id", selectedFolderId);

  const input = document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("value", "New Folder");
  input.setAttribute("data-level", selectedFolderLevel+1);

  newDiv.appendChild(input);
  parentDiv.appendChild(newDiv);
});


// Save tab to the bookmarks
document.querySelector("button#footer-btn-save").addEventListener("click", (event) => {
  const selectedFolder = document.querySelector("div.bookmark-folder-selected");
  const selectedFolderName = selectedFolder.innerText;

  if (!selectedFolder) {
    return;
  }

  let selectedFolderId = selectedFolder.getAttribute("data-id");
  let selectedFolderParentId = selectedFolder.getAttribute("data-parent-id");

  console.log("click::save", "selectedFolderId:", selectedFolderId, "selectedFolderParentId:", selectedFolderParentId);
  console.log("click::save", "selectedFolder.children", selectedFolder.children, selectedFolder.children.length);

  if (selectedFolderId === null || selectedFolderId === undefined) {
    const selectedFolderInput = selectedFolder.children[0];
    console.log("click::save", "creating a folder", selectedFolderInput, selectedFolderInput.value)
    chrome.bookmarks.create(
      {"parentId": selectedFolderParentId, "title": selectedFolderInput.value},
      function(newFolder) {
        console.log("click::save", "Created a newFolder", newFolder);
        selectedFolderId = newFolder.id;
        chrome.bookmarks.create({
          'parentId': newFolder.id,
          'title': ACTIVE_TAB.title,
          'url': ACTIVE_TAB.url,
        });
        saveRecentFolders({name: selectedFolderName, id: selectedFolderId, parentId: selectedFolderParentId});
      },
    );
  } else {
    console.log("click::save", "selectedFolderId", selectedFolderId);
    chrome.bookmarks.create({
      'parentId': selectedFolderId,
      'title': ACTIVE_TAB.title,
      'url': ACTIVE_TAB.url,
    }, (newFolder) => {
      console.log("click::save", "Saved a bookmark", newFolder);
      saveRecentFolders({name: selectedFolderName, id: selectedFolderId, parentId: selectedFolderParentId});
    });
  }
});
