// ==UserScript==
// @name         GitHub PR Conversation copy-file button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add a `copy filepath` button next to PR review threads in the `Conversation` tab
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        window.onurlchange
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    const URL_REGEX = /https:\/\/github.com\/.+\/.+\/[0-9]+/

    // Listen to url changes and run main function if url matches the url we're interested in
    // https://www.tampermonkey.net/documentation.php?locale=en#meta:include
    if (window.onurlchange === null) {
        window.addEventListener("urlchange", (info) => {
            if (!info || !info.url) return

            if (URL_REGEX.test(info.url)) {
                setTimeout(addCopyFilePathButtons, 1000)
            }
        })
    }

    function addCopyFilePathButtons() {
        const COPY_BUTTON_REF = "custom-copy-file-path-button"

        const reviewThreads = $("details.review-thread-component")

        reviewThreads.each((_, container) => {
            // Get the title
            const filePathElement = $(container).find("summary").find("a")
            const titleContainer = filePathElement.parent()

            // Bail if this thread already has our copy button
            const existingCopyFilePathButton = titleContainer.find(`[data-deduplicate='${COPY_BUTTON_REF}']`)
            if (existingCopyFilePathButton.length > 0) return

            // Get the filePath
            let filePath = filePathElement.get()[0].textContent
            if (!filePath) return

            // GH shortens long filenames by prepending ...; remove those dots from our filepath.
            // This means the filepath might not exactly match the actual file's path, but it should be close enough to allow you to paste
            // it into an editor and have it find the file.
            if (filePath.startsWith("...")) {
                filePath = filePath.slice(3)
            }

            // Create our copy button
            const copyBtn = document.createElement("div")
            copyBtn.setAttribute("data-deduplicate", COPY_BUTTON_REF)
            // (This HTML comes from the copy buttons shown on the `Files changed` tab. That button is exactly what we want to add, so let's just copy it!)
            copyBtn.innerHTML = `
                <clipboard-copy data-copy-feedback="Copied!" aria-label="Copy" value=${filePath} data-view-component="true" class="Link--onHover color-fg-muted ml-2 mr-2" tabindex="0" role="button">
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-copy">
                        <path fill-rule="evenodd" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path><path fill-rule="evenodd" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path>
                    </svg>
                    <svg style="display: none;" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-check color-fg-success">
                        <path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
                    </svg>
                </clipboard-copy>
            `

            // Clicking the copy button collapses the thread. Make it uncollapse it again.
            copyBtn.addEventListener("click", () => titleContainer.click())

            // Add our button to the DOM
            titleContainer.append(copyBtn)
        })

        // If there are any "Load more..." items, it means the threads that are hidden by those items don't yet have our button.
        // Add a click listener to these items to re-run our function when clicked, adding the buttons to those hidden items when they get un-hidden.
        const loadMoreCommentsContainers = $(".pagination-loader-container")
        if (loadMoreCommentsContainers.length > 0) {
            loadMoreCommentsContainers.each((_, container) => {
                const loadMoreCommentsInner = $(container).children().first().get()[0]
                loadMoreCommentsInner.addEventListener("click", () => {
                    setTimeout(() => addCopyFilePathButtons(), 3000)
                })
            })
        }
    }
})();