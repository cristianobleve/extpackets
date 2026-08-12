/**
 * Safe DOM helper functions for ExtPlayer
 */

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  innerHTML?: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  if (innerHTML !== undefined) el.innerHTML = innerHTML;
  return el;
}

export function getElement(target: string | HTMLElement): HTMLElement {
  if (typeof target === 'string') {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) {
      throw new Error(`[ExtPlayer] Element with selector "${target}" was not found in the DOM.`);
    }
    return el;
  }
  return target;
}
