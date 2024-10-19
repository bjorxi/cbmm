const BASE_INDENT = 20; // indent in pixels
let ACTIVE_TAB = {};

const traverseBookmarks = (node, level) => {
  let html = "";

  if (!node.hasOwnProperty("children")) {
    return html;
  }
  // console.log(`level ${level} node title ${node.title}`);
  const indent = BASE_INDENT * level;
  // <i class="fa-solid fa-angle-right">
  html += `<div class="bookmark-folder level-${level}" style="padding-left:${indent}px;" data-id="${node.id}" data-parent-id="${node.parentId}">`
  + `</i><i class="fa-regular fa-folder"></i>${node.title}`
  + `</div>`;

  for (const child of node.children) {
    html += traverseBookmarks(child, level +1);
  }

  return html;
};

// Fetch current bookmarks
chrome.bookmarks.getTree((nodes) => {
  console.log("nodes", nodes, typeof nodes);
  const divBookmarksTree = document.querySelector("div#bookmarks-tree");

  let bookmarksTreeHTML = "";
  for (const child of nodes[0].children) {
    bookmarksTreeHTML += traverseBookmarks(child, 0);
  }


  divBookmarksTree.innerHTML = bookmarksTreeHTML;

  divBookmarksTree.addEventListener("click", (event) => {
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


// Create a new folder
document.querySelector("button#footer-btn-new-folder").addEventListener("click", (event) => {

});


// Save tab to the bookmarks

document.querySelector("button#footer-btn-save").addEventListener("click", (event) => {
  const selectedFolder = document.querySelector("div.bookmark-folder-selected");
  const parentId = selectedFolder.getAttribute("data-id");
  console.log("parentId", parentId);
  chrome.bookmarks.create({
    'parentId': parentId,
    'title': ACTIVE_TAB.title,
    'url': ACTIVE_TAB.url,
  });
  window.close();
});
