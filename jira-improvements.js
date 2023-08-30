// ==UserScript==
// @name         JIRA improvements
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds `Next user` & `Prev user` buttons that selects the prev/next assignee
// @updateURL    https://github.com/justinsmid/userscripts/edit/master/jira-improvements.js
// @downloadURL  https://github.com/justinsmid/userscripts/edit/master/jira-improvements.js
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://*/jira/software/projects*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        window.onurlchange
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';

    const URL_REGEX = /https:\/\/.+\/jira\/software\/projects\/.+/

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
        // Prevent hovering people's avatars from overlapping the next person's
        const assigneeContainers = $("input[name='assignee']").parent()
        assigneeContainers.each((_, container) => {
            container.style.setProperty("z-index", "0", "important")
        })

        // Add hover title to epic badges for full badge text
        // JIRA cuts badges off at 200px. A lot of times, the epic's title is larger, so there's no
        // way of seeing the full title.
        addTitleToEpicBadges()
        // Re-apply titles on scroll since not add badges may be visible initially, so those wouldn't have the title otherwise
        const scrollable = $("[data-test-id*='scrollable']")
        if (scrollable.length > 0) {
            scrollable.get()[0].addEventListener("scroll", addTitleToEpicBadges)
        }

        // Add prev/next user buttons
        addPrevUserButton()
        addNextUserButton()
    }

    function addTitleToEpicBadges() {
        const epicBadges = $("[data-testid*='ui.epic']")
        epicBadges.each((_, badge) => {
            const container = $(badge).parent().parent().get()[0]
            container.title = badge.textContent
        })
    }

    function addNextUserButton() {
        // Bail if our button is already present
        const NEXT_USER_BUTTON_ID = "custon-next-user-button"
        if ($(`#${NEXT_USER_BUTTON_ID}`).length > 0) {
            console.warn("'Next user' button already found. Preventing duplicate.")
            return
        }

        // Find existing actions
        const filterActionsContainer = $("div[data-test-id='software-filters.ui.list-filter-container']").get()[0].lastChild
        const existingActions = Array.from(filterActionsContainer.children)

        // Find first visible action
        const actionToClone = existingActions.find((el) => {
            const style = window.getComputedStyle(el)

            const visible = style.visibility === "visible"
            const width = style.width

            if (typeof width === "string" && width.endsWith("px")) {
                const pxWidth = parseInt(width.split("px")[0])
                return visible && pxWidth > 0
            }

            return false
        })
        if (!actionToClone) {
            console.warn("Could not find a suitable action to clone.")
            return
        }

        // Clone found action
        const clone = actionToClone.cloneNode(true)
        clone.style.setProperty("order", "0")
        clone.id = NEXT_USER_BUTTON_ID

        // Update clone's text
        const textContainer = $(clone).find("div[data-testid*='filters.common.ui.list']")
        textContainer.get()[0].firstChild.textContent = "Next user >"

        // Remove clone's icon
        const iconContainer = $(clone).find("span[role='img']").parent().get()[0]
        if (iconContainer) {
            iconContainer.style.setProperty("visibility", "hidden")
            iconContainer.style.setProperty("width", "0")
        }

        const selectNextUser = () => {
            const searchParams = new URLSearchParams(window.location.search)

            const usersContainer = $("fieldset[data-test-id='filters.ui.filters.assignee.stateless.assignee-filter']")
            const userContainers = Array.from(usersContainer.find("div").first().children())

            const firstUserAvatar = usersContainer.find("input[name='assignee']").first()

            const openUserDropdownAvatarContainer = $(userContainers[userContainers.length - 2])
            const openUserDropdownAvatar = openUserDropdownAvatarContainer.find("input[name='assignee']")

            if (!searchParams || !searchParams.has("assignee")) {
                // No current user selected; select first user.
                firstUserAvatar.click()

                return
            } else {
                // User is selected. Determine who it is and select the next user.
                const encodedUserId = searchParams.get("assignee")
                const userId = decodeURIComponent(encodedUserId)

                const selectedUserAvatar = usersContainer.find(`input[id='assignee-${userId}']`)
                if (selectedUserAvatar.length <= 0) {
                    // If we do have a selected user, but can't find it as part of the avatars, it probably means it's a user in the +n dropdown. Look there.
                    openUserDropdownAvatar.click()

                    const dropdownContainer = $("[id*='dropdown']")
                    if (dropdownContainer.length <= 0) {
                        console.warn("Could not find user dropdown")
                        $("body").click()
                        return
                    }

                    const dropdownItemsContainer = dropdownContainer.find("[role='menu']").children(":first")
                    const dropdownItems = dropdownItemsContainer.children()

                    // Find selected dropdown item
                    const selectedDropdownItem = dropdownItems.find(`button[role='menuitemcheckbox'][id='${userId}']`)
                    if (selectedDropdownItem.length <= 0) {
                        console.warn("Could not find selected user's button in dropdown")
                        $("body").click()
                        return
                    }

                    // Deselected selected item
                    selectedDropdownItem.click()

                    // Find next dropdown item
                    const selectedDropdownContainer = selectedDropdownItem.parent()
                    const nextDropdownContainer = selectedDropdownContainer.next()
                    if (nextDropdownContainer.length <= 0) {
                        // If we did find a selected item in the dropdown, but no following item, it indicates the last user is selected. Wrap back to the first user.
                        firstUserAvatar.click()
                        return
                    }

                    // If we did find a next dropdown item, select it.
                    nextDropdownContainer.get()[0].style.setProperty("outline", "2px solid var(--ds-border-focused, #4c9aff)")
                    const nextDropdownItem = nextDropdownContainer.find("button[role='menuitemcheckbox']")
                    nextDropdownItem.click()

                    // Close dropdown. Delay by a bit so people can see who got selected in the dropdown.
                    setTimeout(() => {
                        $("body").click()
                    }, 500)
                } else {
                    // Otherwise, if we did find a selected user avatar...
                    const selectedUserContainer = selectedUserAvatar.parent()

                    // Deselect selected user
                    selectedUserAvatar.click()

                    // Find next user
                    const nextUserContainer = selectedUserContainer.next()
                    const nextUserAvatar = nextUserContainer.find("input[name='assignee']")

                    const selectedUserIndex = userContainers.indexOf(selectedUserContainer.get()[0])
                    const isLastUserAvatar = selectedUserIndex === userContainers.length - 3 // -3 because the last two avatars aren't actually of users, and it's 0-based indexing.
                    if (isLastUserAvatar) {
                        // When the last user avatar is selected, select the next user from the dropdown instead.

                        // Open the dropdown
                        openUserDropdownAvatar.click()

                        // Find the first dropdown item
                        const dropdownContainer = $("[id*='dropdown']")
                        if (dropdownContainer.length <= 0) return

                        const dropdownItemsContainer = dropdownContainer.find("[role='menu']").children(":first")
                        const dropdownItems = dropdownItemsContainer.children()
                        const firstDropdownItem = dropdownItems.first()

                        // Select it
                        firstDropdownItem.find("button").first().click()

                        // Close the dropdown
                        setTimeout(() => {
                            $("body").click()
                        }, 500)

                        return
                    } else {
                        // Otherwise, the next user's avatar is shown. Select it.
                        nextUserAvatar.click()
                    }
                }

                return
            }
        }

        clone.addEventListener("click", selectNextUser)

        // Add cloned action to DOM
        filterActionsContainer.append(clone)
    }

    function addPrevUserButton() {
        // Bail if our button is already present
        const PREV_USER_BUTTON_ID = "custon-prev-user-button"
        if ($(`#${PREV_USER_BUTTON_ID}`).length > 0) {
            console.warn("'Prev user' button already found. Preventing duplicate.")
            return
        }

        // Find existing actions
        const filterActionsContainer = $("div[data-test-id='software-filters.ui.list-filter-container']").get()[0].lastChild
        const existingActions = Array.from(filterActionsContainer.children)

        // Find first visible action
        const actionToClone = existingActions.find((el) => {
            const style = window.getComputedStyle(el)

            const visible = style.visibility === "visible"
            const width = style.width

            if (typeof width === "string" && width.endsWith("px")) {
                const pxWidth = parseInt(width.split("px")[0])
                return visible && pxWidth > 0
            }

            return false
        })
        if (!actionToClone) {
            console.warn("Could not find a suitable action to clone.")
            return
        }

        // Clone found action
        const clone = actionToClone.cloneNode(true)
        clone.style.setProperty("order", "0")
        clone.id = PREV_USER_BUTTON_ID

        // Update clone's text
        const textContainer = $(clone).find("div[data-testid*='filters.common.ui.list']")
        textContainer.get()[0].firstChild.textContent = "< Prev user"

        // Remove clone's icon
        const iconContainer = $(clone).find("span[role='img']").parent().get()[0]
        if (iconContainer) {
            iconContainer.style.setProperty("visibility", "hidden")
            iconContainer.style.setProperty("width", "0")
        }

        const selectPrevUser = () => {
            const searchParams = new URLSearchParams(window.location.search)

            const usersContainer = $("fieldset[data-test-id='filters.ui.filters.assignee.stateless.assignee-filter']")
            const userContainers = Array.from(usersContainer.find("div").first().children())

            const firstUserAvatar = usersContainer.find("input[name='assignee']").first()
            const lastUserAvatar = usersContainer.find("input[name='assignee']").eq(userContainers.length - 3) // The last few avatars aren't actually user-avatars, so skip those.

            const openUserDropdownAvatarContainer = $(userContainers[userContainers.length - 2])
            const openUserDropdownAvatar = openUserDropdownAvatarContainer.find("input[name='assignee']")

            if (!searchParams || !searchParams.has("assignee")) {
                // No current user selected; select first user.
                firstUserAvatar.click()

                return
            } else {
                // User is selected. Determine who it is and select the next user.
                const encodedUserId = searchParams.get("assignee")
                const userId = decodeURIComponent(encodedUserId)

                const selectedUserAvatar = usersContainer.find(`input[id='assignee-${userId}']`)
                if (selectedUserAvatar.length <= 0) {
                    // If we do have a selected user, but can't find it as part of the avatars, it probably means it's a user in the +n dropdown. Look there.
                    openUserDropdownAvatar.click()

                    const dropdownContainer = $("[id*='dropdown']")
                    if (dropdownContainer.length <= 0) {
                        console.warn("Could not find user dropdown")
                        $("body").click()
                        return
                    }

                    const dropdownItemsContainer = dropdownContainer.find("[role='menu']").children(":first")
                    const dropdownItems = dropdownItemsContainer.children()

                    // Find selected dropdown item
                    const selectedDropdownItem = dropdownItems.find(`button[role='menuitemcheckbox'][id='${userId}']`)
                    if (selectedDropdownItem.length <= 0) {
                        console.warn("Could not find selected user's button in dropdown")
                        $("body").click()
                        return
                    }

                    // Deselected selected item
                    selectedDropdownItem.click()

                    // Find prev dropdown item
                    const selectedDropdownContainer = selectedDropdownItem.parent()
                    const prevDropdownContainer = selectedDropdownContainer.prev()
                    if (prevDropdownContainer.length <= 0) {
                        // If we did find a selected item in the dropdown, but no previous item, it indicates the first user is selected. Select the last user outside of the dropdown
                        lastUserAvatar.click()
                        return
                    }

                    // If we did find a prev dropdown item, select it.
                    prevDropdownContainer.get()[0].style.setProperty("outline", "2px solid var(--ds-border-focused, #4c9aff)")
                    const prevDropdownItem = prevDropdownContainer.find("button[role='menuitemcheckbox']")
                    prevDropdownItem.click()

                    // Close dropdown. Delay by a bit so people can see who got selected in the dropdown.
                    setTimeout(() => {
                        $("body").click()
                    }, 500)
                } else {
                    // Otherwise, if we did find a selected user avatar...
                    const selectedUserContainer = selectedUserAvatar.parent()

                    // Deselect selected user
                    selectedUserAvatar.click()

                    // Find prev user
                    const prevUserContainer = selectedUserContainer.prev()
                    const prevUserAvatar = prevUserContainer.find("input[name='assignee']")

                    const selectedUserIndex = userContainers.indexOf(selectedUserContainer.get()[0])
                    const isFirstUserAvatar = selectedUserIndex === 0
                    if (isFirstUserAvatar) {
                        // When the first user avatar is selected, select the last user from the dropdown instead.

                        // Open the dropdown
                        openUserDropdownAvatar.click()

                        // Find the last dropdown item
                        const dropdownContainer = $("[id*='dropdown']")
                        if (dropdownContainer.length <= 0) return

                        const dropdownItemsContainer = dropdownContainer.find("[role='menu']").children(":first")
                        const dropdownItems = dropdownItemsContainer.children()
                        const lastDropdownItem = dropdownItems.last()

                        // Select it
                        lastDropdownItem.find("button").first().click()

                        // Close the dropdown
                        setTimeout(() => {
                            $("body").click()
                        }, 500)

                        return
                    } else {
                        // Otherwise, the previous user's avatar is shown. Select it.
                        prevUserAvatar.click()
                    }
                }

                return
            }
        }

        clone.addEventListener("click", selectPrevUser)

        // Add cloned action to DOM
        filterActionsContainer.append(clone)
    }
})();