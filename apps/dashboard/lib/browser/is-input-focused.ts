import 'client-only';

export function isInputFocused(): boolean {
  const focusedElement = document.activeElement;
  return (
    !!focusedElement &&
    (focusedElement.tagName === 'INPUT' ||
      focusedElement.tagName === 'TEXTAREA')
  );
}
