$(document).ready(() => {
  const main = () => {
    $("input#filter").focus();
    getActiveTabInfo();
    fetchBookmarksAndDisplay();
    showRecentFolders();
  }

  main();

  document
    .querySelector("button#footer-btn-cancel")
    .addEventListener("click", (event) => {
      window.close();
    });

  // Show "Create a new folder" window

  $(document).on("click", "button#footer-btn-new-folder", (event) => {
      const selectedFolderDiv = $("div.bookmark-folder-selected");
      console.log("newFolderClick", "selectedFolderdiv", selectedFolderDiv);

      if (selectedFolderDiv === null || selectedFolderDiv === undefined) {
        return;
      }

      const selectedFolderDivNextElement = selectedFolderDiv.next();
      const selectedFolderDivId = parseInt(selectedFolderDiv.attr("data-id"));
      const selectedFolderDivLevel = parseInt(
        selectedFolderDiv.attr("data-level")
      );

      console.log(
        "newFolderClick",
        "selectedFolderDivId",
        selectedFolderDivId,
        `div[data-parent-id="${selectedFolderDivId}"]`
      );

      let bookmarkTreeContainerExists = true;
      let containerDiv = selectedFolderDivNextElement;
      if (selectedFolderDivNextElement.attr("class").indexOf("bookmark-tree-container") === -1) {
        bookmarkTreeContainerExists = false;
        containerDiv = $(
          `<div class="bookmark-tree-container" data-parent-id="${selectedFolderDivId}"></div>`
        );
        selectedFolderDiv.after(containerDiv);
      }

      console.log(
        "newFolderClick",
        `selectedFolderDivNextElement.attr("class")`,
        selectedFolderDivNextElement.attr("class")
      );
      selectedFolderDiv.removeClass("bookmark-folder-selected");

      const newDivLevel = selectedFolderDivLevel + 1;
      const newDiv = $(`
      <div class="bookmark-folder-selected" style="padding-left: ${
        BASE_INDENT * newDivLevel
      }px" data-parent-id="${selectedFolderDivId}">
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
  $(document).on("click", "button#footer-btn-save", (event) => {
      const selectedFolder = $("div.bookmark-folder-selected");
      const selectedFolderName = selectedFolder.innerText;

      if (!selectedFolder) {
        return;
      }

      let selectedFolderId = selectedFolder.attr("data-id");
      let selectedFolderParentId = selectedFolder.attr("data-parent-id");

      console.log(
        "click::save",
        "selectedFolderId:",
        selectedFolderId,
        "selectedFolderParentId:",
        selectedFolderParentId
      );

      const bookmarkUrlExistOut = BMT.checkBookmarkUrlExist(ACTIVE_TAB.url);
      const bookmarkExists = bookmarkUrlExistOut[0];
      const existingBookmarkData = bookmarkUrlExistOut[1];
      console.log("click::save", "bookmarkUrlExistOut", bookmarkUrlExistOut);
      if (bookmarkExists === true) {
        console.log("click::save", "bookmarExists. data", existingBookmarkData);
        BMT.move(existingBookmarkData.id, null, selectedFolderId);
        return;
      }

      if (selectedFolderId === null || selectedFolderId === undefined) {
        const selectedFolderInput = selectedFolder.children()[0];
        console.log("click::save", "creating a folder", selectedFolderInput, selectedFolderInput.value);

        BMT.createFolder(selectedFolderParentId, selectedFolderInput.value, (newFolder) => {
          chrome.bookmarks.create({
            parentId: newFolder.id,
            title: ACTIVE_TAB.title,
            url: ACTIVE_TAB.url,
          }, () => {
            saveRecentFolders({
              name: selectedFolderInput.value,
              id: selectedFolderId,
              parentId: selectedFolderParentId,
            });
          });
        });
      } else {
        console.log("click::save", "selectedFolderId", selectedFolderId);
        BMT.create(selectedFolderId, ACTIVE_TAB.title, ACTIVE_TAB.url, (newFolder) => {
          saveRecentFolders({
            name: selectedFolderName,
            id: selectedFolderId,
            parentId: selectedFolderParentId,
          });
        });        
      }
    });
});
