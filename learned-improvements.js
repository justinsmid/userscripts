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
        makeModalsClosable()
    }

    function makeModalsClosable() {
        $("body").on("keydown", (event) => {
            if (event.key !== "Escape") return

            const modals = getModals()
            modals.forEach(closeModal)
        })

        $("body").on("click", (event) => {
            const modals = getModals()

            modals.forEach((modal) => {
                const modalContent = modal.children[0]

                const isWithinModal = isEventWithinElement(event, modal)
                const isWithinModalContent = isEventWithinElement(event, modalContent)

                if (isWithinModal && !isWithinModalContent) {
                    closeModal(modal)
                }
            })
        })
    }

    function getModals() {
        // Learned seems to apply a randomized class to its modal element. Filter the root-level elements for the ones that have modals' css properties
        return $("body > div").toArray().filter((element) => {
            const position = $(element).css("position")
            const zIndex = $(element).css("zIndex")

            return position === "fixed" && zIndex === "1000"
        })
    }

    function closeModal(modal) {
        // Again, Learned doesn't apply a clear class or anything to the close button, so we have to look at certain CSS properties to determine
        // which element is the close button.
        const closeButton = findChildDeep(modal, (child) => {
            const width = child.getAttribute("width")
            const height = child.getAttribute("height")
            const mask = $(child).css("-webkit-mask-image")

            return [width, height].every((value) => value === "24px") && /icons-.+close.+\.svg/.test(mask)
        })

        if (!closeButton) {
            console.warn("Could not find close button to close modal", { modal })
            return
        }

        closeButton.click()
    }

    const MIN_TEXTAREA_HEIGHT = "120px"
    const MAX_TEXTAREA_HEIGHT = "550px"

    function makeTextareasResizable() {
        $(".ql-container").each((_, container) => {
            container.style.minHeight = MIN_TEXTAREA_HEIGHT
            container.style.maxHeight = MAX_TEXTAREA_HEIGHT

            const textarea = $(container).find(".ql-editor").get()[0]
            textarea.style.resize = "vertical"
            textarea.style.minHeight = MIN_TEXTAREA_HEIGHT
            textarea.style.maxHeight = MAX_TEXTAREA_HEIGHT
        })
    }

    function _makeTextareasResizable() {
        makeTextareasResizable()
        // Textareas also appear in stuff like modals that aren't initially shown, so do it on an interval to also update those.
        setInterval(() => {
            makeTextareasResizable()
        }, 3000)
    }

    function findChildDeep(element, predicate) {
        if (predicate(element)) {
            return element
        }

        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i]
            const found = findChildDeep(child, predicate)
            if (found) {
                return found
            }
        }

        return null
    }

    function isEventWithinElement(event, element) {
        const target = event.target
        return target === element || element.contains(target)
    }
})();