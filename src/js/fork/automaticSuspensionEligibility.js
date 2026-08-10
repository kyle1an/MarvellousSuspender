async function isStandaloneAppWindowTab(tab, getWindowById) {
  if (!tab || typeof tab.windowId !== 'number') {
    return false;
  }

  const tabWindow = await getWindowById(tab.windowId);
  return tabWindow?.type === 'app' || tabWindow?.type === 'popup';
}

export async function shouldSkipAutomaticSuspension(
  tab,
  forceLevel,
  getWindowById,
) {
  if (!(forceLevel >= 3)) {
    return false;
  }

  return isStandaloneAppWindowTab(tab, getWindowById);
}
