import  { gsIndexedDb }           from '../gsIndexedDb.js';
import  { gsUtils }               from '../gsUtils.js';

/**
 * Persist source metadata that cannot safely travel in a Suspended Page URL.
 *
 * @param {chrome.tabs.Tab} tab
 * @returns {Promise<void>}
 */
export async function saveSuspendedTabInfo(tab) {
  await gsIndexedDb.addSuspendedTabInfo({
    date: new Date(),
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    index: tab.index,
    windowId: tab.windowId,
  });
}

/**
 * Persist the tab metadata, then build the Suspended Page URL only after
 * persistence has completed.
 *
 * @param {chrome.tabs.Tab} tab
 * @param {number | string} [scrollPosition]
 * @returns {Promise<string>}
 */
export async function prepareSuspendedTab(tab, scrollPosition = 0) {
  await saveSuspendedTabInfo(tab);

  return gsUtils.generateSuspendedUrl(
    tab.url,
    tab.title,
    scrollPosition,
    tab.favIconUrl,
  );
}
