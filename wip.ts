// ==UserScript==
// @name         GitHub PR File-viewed improvements
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  TODO
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        window.onurlchange
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    const URL_REGEX = /https:\/\/github.com\/.+\/.+\/pull\/[0-9]+/

    // Listen to url changes and run main function if url matches the url we're interested in
    // https://www.tampermonkey.net/documentation.php?locale=en#meta:include
    if (window.onurlchange === null) {
        window.addEventListener("urlchange", (info) => {
            if (!info || !info.url) return

            if (URL_REGEX.test(info.url)) {
                setTimeout(main, 1000)
            }
        })
    }

    function main() {
        console.log("File-viewed main()")

        // Prevent script from setting event listener multiple times
        if (window.deduplicateFileViewedListenerSet) return
        window.deduplicateFileViewedListenerSet = true

        const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

        let currentFileViewedIndex = -1

        document.addEventListener("keydown", (event) => {
            if (!event.altKey) return

            switch (event.key) {
                case "w":
                    return handleSelectPreviousFileViewedButton()
                case "s":
                    return handleSelectNextFileViewedButton()
            }
        })

        function handleSelectPreviousFileViewedButton() {
            const buttons = $(".js-reviewed-toggle")
            currentFileViewedIndex = clamp(currentFileViewedIndex - 1, 0, buttons.length)
            selectFileViewedButton(currentFileViewedIndex)
        }

        function handleSelectNextFileViewedButton() {
            const buttons = $(".js-reviewed-toggle")
            currentFileViewedIndex = currentFileViewedIndex + 1 > buttons.length - 1 ? 0 : currentFileViewedIndex + 1
            selectFileViewedButton(currentFileViewedIndex)
        }

        function selectFileViewedButton(index) {
            const buttons = $(".js-reviewed-toggle")
            const button = buttons.eq(index)
            console.log(button)
            button.focus()
        }
    }
})();