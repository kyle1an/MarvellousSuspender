/**
 * Reload the Suspended Page only after Chrome confirms that reload protection
 * has been persisted for the current tab.
 *
 * @param {{
 *   resolveTab: () => Promise<chrome.tabs.Tab | undefined>,
 *   preserveSuspendedState: (tabId: number) => Promise<unknown>,
 *   reload: () => void,
 * }} dependencies
 */
export async function reloadSuspendedPage({
  resolveTab,
  preserveSuspendedState,
  reload,
}) {
  const tab = await resolveTab();
  if (typeof tab?.id !== 'number') {
    throw new Error('Unable to identify the suspended tab');
  }

  await preserveSuspendedState(tab.id);
  reload();
}
