// ==UserScript==
// @name         GitHub workflow run branch name badge
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add workflow run branch name badge to GitHub workflow runs page
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        window.onurlchange
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(async function() {
    'use strict';

    const GH_ACTIONS_URL_REGEX = /https:\/\/github\.com\/.+\/.+\/actions/g

    // Listen to url changes and run main function if url matches the url we're interested in
    // https://www.tampermonkey.net/documentation.php?locale=en#meta:include
    if (window.onurlchange === null) {
        window.addEventListener("urlchange", (info) => {
            if (!info || !info.url) return

            if (GH_ACTIONS_URL_REGEX.test(info.url)) {
                setTimeout(addBadgesToWorkflowRuns, 100)
            }
        })
    }

    async function addBadgesToWorkflowRuns() {
        const GH_API_TOKEN = "<GITHUB_API_TOKEN>"

        const url = window.location.href
        const urlMatches = url.match(/.+github.com\/(.+)\/(.+)\/actions/)
        if (!urlMatches) return

        const [_, owner, repo] = urlMatches
        if (!owner || !repo) {
            console.warn(`Failed to parse owner and/or repository from url '${url}'`)
            return
        }

        const GH_API_BASE_URL = "https://api.github.com"
        const GH_API_RUNS_URL = `${GH_API_BASE_URL}/repos/${owner}/${repo}/actions/runs`
        const GH_API_HEADERS = {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${GH_API_TOKEN}`,
        }

        const api = (url) => fetch(url, { headers: GH_API_HEADERS }).then((r) => r.json())

        const workflowContainers = Array.from($("div.d-table"))

        // Create a badge for each run.
        const badgePromises = workflowContainers.map(async (workflowContainer) => {
            const titleContainer = $(workflowContainer).find("span.h4").get()[0]
            if (!titleContainer) return null

            // GitHub shows branch names for some workflow runs. Skip those.
            // https://github.com/orgs/community/discussions/15690
            const nativeBranchNameBadge = $(workflowContainer).find(".branch-name")
            if (nativeBranchNameBadge.length > 0) return null

            // Make title container a flexbox
            titleContainer.style.setProperty("display", "flex", "important")
            titleContainer.style.setProperty("gap", "6px")
            titleContainer.style.setProperty("align-items", "center")

            // Change min-width of title so it doesn't push our badge all the way to the side
            const workflowLink = $(titleContainer).find("a.Link--primary:first").get()[0]
            workflowLink.style.setProperty("min-width", "fit-content")

            // Get workflow run ID
            const href = workflowLink.getAttribute("href")
            const id = href.split("/").at(-1)

            // Fetch run data to get branch
            const apiResponse = await api(`${GH_API_RUNS_URL}/${id}`)
            const branchName = apiResponse.head_branch

            // Add our branchName badge
            const badge = document.createElement("div")
            badge.id = "custom-branch-name-badge"
            badge.style.setProperty("border", "1px solid var(--color-border-default)")
            badge.style.setProperty("border-radius", "2em")
            badge.style.setProperty("padding", "2px 5px")
            badge.style.setProperty("font-size", "12px")
            badge.textContent = branchName

            return { container: titleContainer, badge }
        })

        // Collect all promises and append badges once they're all done.
        // If we did the .append() in the promise, each badge would appear a couple ms after the
        // previous one, which is quite jarring to look at.
        const resolvedPromises = (await Promise.all(badgePromises)).filter((x) => !!x)
        resolvedPromises.forEach(({ container, badge }) => {
            // Not sure why, but this seems to sometimes get called multiple times.
            // Do nothing if the container already has our badge.
            const hasExistingBadge = $(container).find("#custom-branch-name-badge").length > 0
            if (hasExistingBadge) return

            container.append(badge)
        })
    }
})();
