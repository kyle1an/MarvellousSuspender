const MODIFIERS = [
  { tokens: ['Search'], nonMac: 'Search' },
  { tokens: ['Ctrl', 'MacCtrl'], mac: '⌃', nonMac: 'Ctrl' },
  { tokens: ['Alt', 'Option'], mac: '⌥', nonMac: 'Alt' },
  { tokens: ['Shift'], mac: '⇧', nonMac: 'Shift' },
  { tokens: ['⌘'], mac: '⌘', nonMac: 'Meta' },
];

function unwrapShortcut(shortcut) {
  return String(shortcut ?? '')
    .trim()
    .replace(/^\(\s*(.*?)\s*\)$/u, '$1')
    .trim();
}

export function formatShortcutForPlatform(shortcut, os) {
  const modifiers = new Set();
  const keys = [];

  for (const token of unwrapShortcut(shortcut).split(/\s+·\s+/u).filter(Boolean)) {
    const modifier = MODIFIERS.find(({ tokens }) => tokens.includes(token));
    if (modifier) {
      modifiers.add(modifier);
    }
    else {
      keys.push(token);
    }
  }

  if (keys.length === 0) {
    return '';
  }

  const separator = os === 'mac' ? '' : '+';
  return [
    ...MODIFIERS
      .filter((modifier) => modifiers.has(modifier))
      .map((modifier) => os === 'mac' ? modifier.mac : modifier.nonMac)
      .filter(Boolean),
    ...keys,
  ].join(separator);
}

export function presentShortcut(wrapper, os) {
  const command = wrapper.querySelector('.hotkeyCommand');
  if (!command) {
    return false;
  }

  const shortcut = formatShortcutForPlatform(command.textContent, os);
  if (!shortcut) {
    return false;
  }

  if (command.textContent !== shortcut) {
    command.textContent = shortcut;
  }
  return true;
}

export function observeShortcutPresentation(
  wrapper,
  os,
  Observer = MutationObserver,
) {
  const updateShortcut = () => presentShortcut(wrapper, os);
  updateShortcut();

  const observer = new Observer(updateShortcut);
  observer.observe(wrapper, { childList: true });
  return observer;
}
