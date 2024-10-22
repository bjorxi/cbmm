$(document).ready(() => {
  console.log("Documet is ready!");
  const BODY = document.querySelector("body");

  $("input#filter").focus();

  getActiveTabInfo();
  showRecentFolders();
  fetchBookmarksAndDisplay();

  document.querySelector("button#footer-btn-cancel").addEventListener("click", (event) => {
    window.close();
  });

  // Show "Create a new folder" window
  document.querySelector("button#footer-btn-new-folder").addEventListener("click", (event) => {
    const selectedFolderDiv = $("div.bookmark-folder-selected");
    
    console.log("newFolderClick", "selectedFolderdiv", selectedFolderDiv);

    if (selectedFolderDiv === null || selectedFolderDiv === undefined) {
      return;
    }

    const selectedFolderDivNextElement = selectedFolderDiv.next();
    const selectedFolderDivId = parseInt(selectedFolderDiv.attr("data-id"));
    const selectedFolderDivLevel = parseInt(selectedFolderDiv.attr("data-level"));

    console.log("newFolderClick", "selectedFolderDivId", selectedFolderDivId, `div[data-parent-id="${selectedFolderDivId}"]`);

    let bookmarkTreeContainerExists = true;
    let containerDiv = selectedFolderDivNextElement;
    if (selectedFolderDivNextElement.attr("class").indexOf("bookmark-tree-container") === -1) {
      bookmarkTreeContainerExists = false;
      containerDiv = $(`<div class="bookmark-tree-container" data-parent-id="${selectedFolderDivId}"></div>`);
      selectedFolderDiv.after(containerDiv);
    }

    console.log("newFolderClick", `selectedFolderDivNextElement.attr("class")`, selectedFolderDivNextElement.attr("class"));
    selectedFolderDiv.removeClass("bookmark-folder-selected");

    const newDivLevel = selectedFolderDivLevel+1;
    const newDiv = $(`
      <div class="bookmark-folder-selected" style="padding-left: ${BASE_INDENT*newDivLevel}px" data-parent-id="${selectedFolderDivId}">
      <input type="text" value="New Folder" data-level="${newDivLevel}" />
    </div`);
    
    containerDiv.append(newDiv);
  });

  $(document).on("input", "input#filter", (el) => {
    const text = $("input#filter").val();
    console.log("onFilterChange:: value", text);
    if (text.length >= 3) {
      console.log("onFilterChange:: filtering tree");
      BMT.filter(text, "folder");
    } else {
      console.log("onFilterChange:: resetting tree");
      BMT.resetFilter();
    }
    
    const tree = BMT.foldersToHTMLTree();
    console.log("onFilterChange:: htmlTree", tree);
    $("div#bookmarks-tree").html(tree);
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
          saveRecentFolders({name: selectedFolderInput.value, id: selectedFolderId, parentId: selectedFolderParentId});
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
});


