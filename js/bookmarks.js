const BASE_INDENT = 20; // indent in pixels
let BMT = null;


class BookmarksTree {
  constructor() {
    this.root = null;
    this.map = new Map();
  }

  static buildFromChromeData(root) {
    console.log("BookmarksTree::buildFromChromeData root:", root);
    let bmt = new BookmarksTree();
    bmt.root = root;
    bmt.root.display = false;
    let nodesToDiscover = [];

    for (const child of root.children) {
      console.log("BookmarksTree::buildFromChromeData root.child", child);
      nodesToDiscover.push([0, child]); // push an arrays [level, node];
    }

    console.log("BookmarksTree::buildFromChromeData nodesToDiscover", nodesToDiscover.length, nodesToDiscover);
    while (nodesToDiscover.length > 0 ) {
      const item = nodesToDiscover.shift();
      // console.log("BookmarksTree::buildFromChromeData nodesToDiscover::current", item);
      const level = item[0];
      let data = item[1];
      data.level = level;
      // console.log("BookmarksTree::buildFromChromeData nodesToDiscover::current2", "level:", level, "data", data);
      if (data.hasOwnProperty("children")) {
        data.type = "folder";
        for (const child of data.children) {
          nodesToDiscover.push([level+1, child]);
        }
      } else {
        data.type = "page";
      }

      data.display = true;
      bmt.map.set(data.id, data);
    }
    return bmt;
  }

  /**
   * Check if a bookmark with the given url does exist in the bookmark tree
   * 
   * @param {string} url url that is checked for a match
   * @returns {array} the first value is bool: true if the bookmark does exist, otherwise false.
   *          the second value is the bookmark data if a mathc is found, otherwise null
   */
  checkBookmarkUrlExist(url) {
    console.log("BookmarksTree::checkBookmarkUrlExist", `url: ${url}`)
    for (let [key, value] of this.map) {
      if (value.url === url) {
        console.log("BookmarksTree::checkBookmarkUrlExist", `${value.url} === ${url}}`)
        return [true, value];
      }
    }

    return [false, null];
  }

  filter(text, nodeType) {
    console.log("BookmarksTree::filter", "filtering tree. text: ", text, "nodeType:", nodeType);
    const displayNodeAndParents = (node) => {
      if (node === null || node === undefined) {
        return;
      }

      node.display = true;

      if (node.hasOwnProperty("parentId")) {
        displayNodeAndParents(this.map.get(node.parentId));
      }
    }

    // hide all nodes
    this.map.forEach((value, key, map) => {
      value.display = false;
    });

    let nodesToDiscover = [this.root];
    console.log("BookmarksTree::filter", "root: ", this.root);
    while (nodesToDiscover.length > 0) {
      let node = nodesToDiscover.shift();

      if (node.type === nodeType && node.title.indexOf(text) !== -1) {
        // if the node fits the search/filter query make it and it's parents displayable
        displayNodeAndParents(node);
      }

      if (node.hasOwnProperty("children") && node.children.length > 0) {
        nodesToDiscover.push(...node.children);
      }
    }
    console.log("BookmarksTree::filter", "filtered root: ", this.root);
  }

  resetFilter() {
    console.log("BookmarksTree::resetFilter", "resetting");
    // allow displaying all nodes
    this.map.forEach((value, key, map) => {
      value.display = true;
    });
  }

  foldersToHTMLTree() {
    let nodesToDiscover = [];
    let firstParent = document.createElement("div");

    for (const node of this.root.children) {
      nodesToDiscover.push([firstParent, node]);
    }

    while (nodesToDiscover.length > 0) {
      let parent, node;
      [parent, node] = nodesToDiscover.shift();
      // console.log("BookmarksTree::foldersToHTMLTree (parent, node)", parent, node);

      if (node.type === "folder" && node.display === true) {
        const folder = document.createElement("div");

        folder.classList.add("bookmark-folder");
        folder.classList.add(`level-${node.level}`);
        folder.setAttribute("style", `padding-left:${BASE_INDENT*node.level}px;`);
        folder.setAttribute("data-id", `${node.id}`);
        folder.setAttribute("data-parent-id", `${node.parentId}`);
        folder.setAttribute("data-level", `${node.level}`);
        folder.innerHTML = `<i class="fa-regular fa-folder"></i>${node.title}`

        parent.appendChild(folder);

        if (node.children.length > 0) {
          const divTreeContainer = document.createElement("div");
          divTreeContainer.classList.add("bookmark-tree-container");
          divTreeContainer.setAttribute("data-parent-id", node.id);
          parent.appendChild(divTreeContainer);

          for (const child of node.children) {
            nodesToDiscover.push([divTreeContainer, child]);
          }
        }
      }
    }

    return firstParent;
  }

  /**
   * Adds a new bookmark 
   * 
   * @param {integer} parentId  parent id for the saved bookmark
   * @param {string} title  title/name of the saved bookmark
   * @param {string} url  url of the saved bookmark
   * @param {} callback callback that is called once the bookmark is saved
   */
  create(parentId, title, url, callback) {
    chrome.bookmarks.create(
      {
        parentId: parentId,
        title: title,
        url: url,
      },
      (newFolder) => {
        console.log("BookmarksTree::create", "Saved a bookmark", newFolder);
        if (typeof(callback)==='function') {
          callback(newFolder);
        }
      }
    );
  }

  /**
   * Creates a new folder in the bookmarks tree
   * 
   * @param {integer} parentId id of the parent's folder. under this id the new folder will be created
   * @param {string} title title/name of the new folder
   * @param {*} callback 
   */
  createFolder(parentId, title, callback) {
    chrome.bookmarks.create(
      {
        parentId: parentId,
        title: title,
      },
      (newFolder) => {
        console.log("BookmarkTree::createFolder", "Created a newFolder", newFolder);
        if (typeof(callback)==='function') {
          callback(newFolder);
        }
      }
    );
  }

  /**
   * Moves a bookmark to a new folder
   * 
   * @param {*} id id of the bookmark that is being moved
   * @param {*} destIdx - no idea what's this. it's optional
   * @param {*} parentId new parent
   */
  move(id, destIdx, parentId) {
    chrome.bookmarks.move(id, {index: destIdx, parentId});
  }

} // BookmarksTree

const fetchBookmarksAndDisplay = () => {
  // Fetch current bookmarks
  chrome.bookmarks.getTree((nodes) => {
    BMT = BookmarksTree.buildFromChromeData(nodes[0]);
    console.log(BMT.map);

    console.log("nodes", nodes, typeof nodes);
    const divBookmarksTree = document.querySelector("div#bookmarks-tree");
    divBookmarksTree.appendChild(BMT.foldersToHTMLTree());
    // for (const child of nodes[0].children) {
    //   buildBookmarksTree(child, divBookmarksTree, 0);
    // }

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
}

