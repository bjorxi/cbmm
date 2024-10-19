const BASE_INDENT = 20; // indent in pixels
let ACTIVE_TAB = {};

const buildBookmarksTree = (node, parent, level) => {
  if (!node.hasOwnProperty("children")) {
    return 0;
  }

  const folderIcon = document.createElement("i"),
        folder = document.createElement("div");

  folderIcon.classList.add("fa-regular");
  folderIcon.classList.add("fa-folder");
  folder.appendChild(folderIcon);

  folder.classList.add("bookmark-folder");
  folder.classList.add(`level-${level}`);
  folder.setAttribute("style", `padding-left:${BASE_INDENT*level}px;`);
  folder.setAttribute("data-id", `${node.id}`);
  folder.setAttribute("data-parent-id", `${node.parentId}`);
  folder.setAttribute("data-level", `${level}`);
  folder.innerText = node.title;

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

  // const divTreeContainer = document.createElement("div");
  // divTreeContainer.classList.add("bookmark-tree-container");
  // divBookmarksTree.appendChild(divTreeContainer);

  let bookmarksTreeHTML = "";
  for (const child of nodes[0].children) {
    buildBookmarksTree(child, divBookmarksTree, 0);
  }


  // divBookmarksTree.innerHTML = bookmarksTreeHTML;

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

  if (!selectedFolder) {
    return;
  }

  let selectedFolderId = selectedFolder.getAttribute("data-id");
  let selectedFolderParentId = selectedFolder.getAttribute("data-parent-id");

  console.log("selectedFolder.children", selectedFolder.children, selectedFolder.children.length);

  if (selectedFolder.children.length >= 1) {
    const selectedFolderInput = selectedFolder.children[0];
    console.log("creating a folder", selectedFolderInput, selectedFolderInput.value)
    chrome.bookmarks.create(
      {"parentId": selectedFolderParentId, "title": selectedFolderInput.value},
      function(newFolder) {
        console.log("newFolder", newFolder);
        selectedFolderId = newFolder.id;
        chrome.bookmarks.create({
          'parentId': newFolder.id,
          'title': ACTIVE_TAB.title,
          'url': ACTIVE_TAB.url,
        });
      },
    );
  } else {
    console.log("selectedFolderId", selectedFolderId);
    chrome.bookmarks.create({
      'parentId': selectedFolderId,
      'title': ACTIVE_TAB.title,
      'url': ACTIVE_TAB.url,
    });
  }

  window.close();
});
