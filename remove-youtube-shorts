// ==UserScript==
// @name         Remove YouTube Shorts
// @version      1.0
// @description  Removes YouTube Shorts.
// @author       Justin Smid
// @match        http://*.youtube.com/*
// @match        https://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==
;(() => {
  const removeShorts = () => {
    const containers = document.querySelectorAll('#content')
    if (!containers) return

    const shortsContainers = Array.from(containers).filter((container) => {
      const title = container.querySelector('#title')
      if (!title) return false

      const text = title.textContent
      return text === 'Shorts'
    })

    shortsContainers.forEach((el) => el.remove())
  }

  const observer = new MutationObserver(removeShorts)
  observer.observe(document, { childList: true, subtree: true })

  removeShorts()
})()
