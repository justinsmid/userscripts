// ==UserScript==
// @name         Locize test
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  TODO
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://www.locize.app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=locize.app
// @grant        window.onurlchange
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/**
 * Work in progress
 */

(function() {
    'use strict';

    const URL_REGEX = /https:\/\/www.locize.app\/cat\/.+/

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
        console.log("main()")

        const middleColumn = $(".cat-ui-col-middle")

        const items = middleColumn.find(".cat-ui-segmentlistitem")
        items.each((_, itemContainer) => {
            const titleContainer = $(itemContainer).children().first()
            const itemContentContainer = titleContainer.next()
            const itemFooter = itemContentContainer.children().last()

            const existingTranslateAllButton = titleContainer.find("[data-translate-all-button='true']")
            if (existingTranslateAllButton.length > 0) return

            const titleActionIcon = titleContainer.find("button.cat-ui-iconbutton").first().get()[0]

            const translateAllButton = titleActionIcon.cloneNode(true)
            translateAllButton.title = "Machine translate all languages"
            translateAllButton.setAttribute("data-translate-all-button", true)
            translateAllButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="cat-ui-iconbutton-icon" width="14" height="14">
                    <path d="M21 4H11l-1-3H3c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h8l1 3h9c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7 16c-2.76 0-5-2.24-5-5s2.24-5 5-5c1.35 0 2.48.5 3.35 1.3L9.03 8.57c-.38-.36-1.04-.78-2.03-.78-1.74 0-3.15 1.44-3.15 3.21S5.26 14.21 7 14.21c2.01 0 2.84-1.44 2.92-2.41H7v-1.71h4.68c.07.31.12.61.12 1.02C11.8 13.97 9.89 16 7 16zm6.17-5.42h3.7c-.43 1.25-1.11 2.43-2.05 3.47-.31-.35-.6-.72-.86-1.1l-.79-2.37zm8.33 9.92c0 .55-.45 1-1 1H14l2-2.5-1.04-3.1 3.1 3.1.92-.92-3.3-3.25.02-.02c1.13-1.25 1.93-2.69 2.4-4.22H20v-1.3h-4.53V8h-1.29v1.29h-1.44L11.46 5.5h9.04c.55 0 1 .45 1 1v14z"></path>
                    <path d="M0 0h24v24H0zm0 0h24v24H0z" fill="none"></path>
                </svg>
            `

            translateAllButton.addEventListener("click", () => {
                console.log("Translate all clicked")
                const showLocalesFooterButton = itemFooter.find("button:contains('show')")
                if (showLocalesFooterButton.length > 0) {
                    showLocalesFooterButton.click()
                }

                const subkeyContainers = Array.from(itemContentContainer.find(".cat-ui-segmentlistitem-subkey-wrapper")).slice(1) // Slice(1) because the first subkey is assumed to be the leading one and therefore doesn't need to be translated. It is what is used for the others' translations
                console.log({subkeyContainers})
                subkeyContainers.forEach((subkeyContainer) => {
                    const actionsContainer = $(subkeyContainer).find(".cat-ui-keylistitem-subkey-actions")
                    console.log({actionsContainer})
                    const translateButton = actionsContainer.find("button[title='machine translate']")
                    console.log({translateButton})
                    translateButton.get()[0].click()
                })
            })

            titleContainer.append(translateAllButton)
        })


        /*
        const toolbar = middleColumn.find(".cat-ui-segmentlist-title")
        const addButton = toolbar.find("button:contains('ADD')").get()[0]

        if (addButton.hasAttribute("data-deduplicate-add-click-listener")) {
            return
        } else {
            addButton.addEventListener("click", () => {
                setTimeout(() => {
                    const addMenu = $(".cat-ui-segmentadd-show")
                    if (addMenu.length <= 0) {
                        console.log("Could not find add menu")
                        return
                    }

                    const menuAddButton = addMenu.find(".cat-ui-button[value='Add']")
                    const menuButtonsContainer = menuAddButton.parent()

                    const addAndFindButton = menuAddButton.get()[0].cloneNode(true)
                    addAndFindButton.setAttribute("value", "Add & find")
                    addAndFindButton.addEventListener("click", () => {
                        setTimeout(() => {
                            const inputErrors = addMenu.find(".cat-ui-input-error")
                            if (inputErrors.length > 0) {
                                console.log("Add & find clicked, but errors found. Not searching.")
                                return
                            }

                            console.log("Add & find clicked, no errors found. Searching...")
                            const searchInput = $("input.cat-ui-filtersearch-input")
                            console.log(searchInput)
                            searchInput.val("Products")
                        }, 500)
                    })

                    menuButtonsContainer.append(addAndFindButton)
                }, 500)
            })

            addButton.setAttribute("data-deduplicate-add-click-listener", true)
        }
        */
    }
})();