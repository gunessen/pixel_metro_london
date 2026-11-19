// Minimal screen router. A screen is { show(root, params), hide?() }.
const screens = {};
let current = null;
let root = null;

export function registerScreens(map, rootEl) {
  Object.assign(screens, map);
  root = rootEl;
}

export function go(name, params = {}) {
  current?.hide?.();
  root.replaceChildren();
  root.dataset.screen = name;
  current = screens[name];
  current.show(root, params);
  window.scrollTo(0, 0);
}
