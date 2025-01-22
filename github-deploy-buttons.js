// ==UserScript==
// @name         GitHub deploy buttons
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add "Deploy {master, develop}" buttons to GitHub Actions workflows
// @author       Justin Smid <justin250899@hotmail.com>
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        window.onurlchange
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(async function () {
    'use strict';

    const TOKEN_PLACEHOLDER = "<GITHUB_API_TOKEN>"

    const config = {
        GH_API_TOKEN: TOKEN_PLACEHOLDER,
        WORKFLOW_NAME: "build_and_deploy.yml",
        REFRESH_AFTER_STARTING_WORKFLOW: true,
        HIDE_BUILT_IN_RUN_WORKFLOW_BUTTON: true,
    }

    const hash = Math.random().toString(36).substring(2, 8)

    const GH_ACTIONS_URL_REGEX = /https:\/\/github\.com\/(.+)\/(.+)\/actions\/workflows\/(.+)/

    // Listen to url changes and run main function if url matches the url we're interested in
    // https://www.tampermonkey.net/documentation.php?locale=en#meta:include
    if (window.onurlchange === null) {
        window.addEventListener("urlchange", (info) => {
            if (!info || !info.url) return

            const match = info.url.match(GH_ACTIONS_URL_REGEX)
            if (match) {
                const [, owner, repo, workflow] = match

                if (!owner || !repo) {
                    console.warn(`Failed to parse owner and/or repository from url '${url}'`)
                    return
                }

                if (!workflow || workflow !== config.WORKFLOW_NAME) {
                    return
                }

                if (config.GH_API_TOKEN === TOKEN_PLACEHOLDER) {
                    console.warn("Please set your GitHub API token in the script configuration")
                    return
                }

                main(owner, repo, workflow)
            }
        })
    }

    function main(owner, repo, workflow) {
        addStyles()

        if (config.HIDE_BUILT_IN_RUN_WORKFLOW_BUTTON) {
            hideBuiltInRunWorkflowButton()
        }

        addDeployButtons(owner, repo, workflow)
    }

    function hideBuiltInRunWorkflowButton() {
        const button = $(".btn:contains('Run workflow')").get()[0]
        if (button) {
            button.style.setProperty("display", "none")
        }
    }

    function addDeployButtons(owner, repo, workflow) {
        const deployButtons = $(`button[id^='deploy-${hash}']`)
        if (deployButtons.length > 0) return

        const GH_API_BASE_URL = "https://api.github.com"
        const GH_API_DISPATCH_WORKFLOW_URL = `${GH_API_BASE_URL}/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`
        const GH_API_HEADERS = {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${config.GH_API_TOKEN}`,
        }

        const dispatchWorkflow = (branch) => fetch(GH_API_DISPATCH_WORKFLOW_URL, {
            method: "POST",
            body: JSON.stringify({ ref: branch }),
            headers: GH_API_HEADERS,
        })

        const startWorkflow = async (branch, button) => {
            try {
                button.disabled = true

                const response = await dispatchWorkflow(branch)

                if (response.ok) {
                    if (config.REFRESH_AFTER_STARTING_WORKFLOW) {
                        // GitHub needs a few seconds before the workflow will be shown in their UI
                        setTimeout(() => {
                            window.location.reload()
                            button.disabled = false
                        }, 3000)
                    } else {
                        button.disabled = false
                    }
                } else {
                    console.error(`Failed to start workflow for branch '${branch}'`, response)
                    button.disabled = false
                }
            } catch (e) {
                // Note, we don't reset disabled in a finally block and instead handle it manually because,
                // if we want to reload the page, this function will resolve before that reload occurs,
                // which means the button will be enabled again before the page reloads, which feels really awkward.
                button.disabled = false
                throw e
            }
        }

        const workflowDispatchText = $("span:contains('workflow_dispatch')")
        const container = workflowDispatchText.parent().get()[0]
        if (!container) {
            console.warn("Failed to find container for deploy buttons")
            return
        }

        const div = document.createElement("div")
        div.style.setProperty("display", "flex")
        div.style.setProperty("gap", "10px")

        addDeployButton({
            container: div,
            branch: "master",
            onClick: (button) => startWorkflow("master", button)
        })

        addDeployButton({
            container: div,
            branch: "develop",
            onClick: (button) => startWorkflow("develop", button)
        })

        container.appendChild(div)
    }

    function addDeployButton({ container, branch, onClick }) {
        const button = $(`<button id="deploy-${hash}-${branch}">Deploy ${branch}</button>`)
        const buttonEl = button.get()[0]

        button.click(() => onClick(buttonEl))
        buttonEl.classList.add("deploy-button")

        container.append(buttonEl)
    }

    function addStyles() {
        GM_addStyle(`
            .deploy-button {
                background-color: #F6F8FA;
                color: black;
                font-size: 12px;
                font-weight: 500;
                border: 1px solid lightgray;
                border-radius: 6px;
                padding: 4px 10px;
            }

            .deploy-button:active {
                transform: translate(1px, 1px);
            }

            .deploy-button:disabled {
                color: gray;
                cursor: not-allowed;
            }
        `)
    }
})();