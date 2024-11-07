// ==UserScript==
// @name         GitHub resize popovers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Allow resizing GitHub popovers
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        window.onurlchange
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    GM_addStyle('.SelectMenu-modal { resize: both }')
})();