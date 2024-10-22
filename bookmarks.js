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
}

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

