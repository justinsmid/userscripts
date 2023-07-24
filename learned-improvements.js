// ==UserScript==
// @name         Learned improvements
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Improvements for learned.io
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://app.learned.io/*
// @icon         https://app.learned.io/favicon.ico
// @grant        window.onurlchange
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    const URL_REGEX = /https:\/\/app.learned.io\/.+/

    if (URL_REGEX.test(window.location.href)) {
        setTimeout(main, 2000)
    }

    // Listen to url changes and run main function if url matches the url we're interested in
    // https://www.tampermonkey.net/documentation.php?locale=en#meta:include
    if (window.onurlchange === null) {
        window.addEventListener("urlchange", (info) => {
            if (!info || !info.url) return

            if (URL_REGEX.test(info.url)) {
                setTimeout(main, 2000)
            }
        })
    }

    function main() {
        _makeTextareasResizable()
    }

    function makeTextareasResizable() {
        $(".ql-editor").each((_, textarea) => {
            textarea.style.resize = "vertical"
            textarea.style.minHeight = "120px"
            textarea.style.maxHeight = "550px"
        })
    }

    function _makeTextareasResizable() {
        makeTextareasResizable()
        // Textareas also appear in stuff like modals that aren't initially shown, so do it on an interval to also update those.
        setInterval(() => {
            makeTextareasResizable()
        }, 3000)
    }
})();