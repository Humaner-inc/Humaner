import * as React from 'react';

type Clipboard = {
  read: unknown;
  write: unknown;
  readText(): Promise<string>;
  writeText(text: string): Promise<void>;
};

type ClipboardEventListener =
  | EventListenerObject
  | null
  | ((event: ClipboardEvent) => void);

type ClipboardEventTarget = EventTarget & {
  addEventListener(type: 'copy', eventListener: ClipboardEventListener): void;
  addEventListener(type: 'cut', eventListener: ClipboardEventListener): void;
  addEventListener(type: 'paste', eventListener: ClipboardEventListener): void;
  removeEventListener(
    type: 'copy',
    eventListener: ClipboardEventListener
  ): void;
  removeEventListener(type: 'cut', eventListener: ClipboardEventListener): void;
  removeEventListener(
    type: 'paste',
    eventListener: ClipboardEventListener
  ): void;
};

type ClipboardNavigator = Navigator & {
  clipboard: Clipboard & ClipboardEventTarget;
};

function isClipboardApiEnabled(
  navigator: Navigator
): navigator is ClipboardNavigator {
  return (
    typeof navigator === 'object' && typeof navigator.clipboard === 'object'
  );
}

function zeroStyles(element: HTMLElement, ...properties: string[]): void {
  properties.forEach((property) => element.style.setProperty(property, '0'));
}

function createTextArea(): HTMLTextAreaElement {
  const textArea: HTMLTextAreaElement = document.createElement('textarea');
  textArea.setAttribute('cols', '0');
  textArea.setAttribute('rows', '0');
  zeroStyles(
    textArea,
    'border-width',
    'bottom',
    'margin-left',
    'margin-top',
    'outline-width',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'right'
  );
  textArea.style.setProperty('box-sizing', 'border-box');
  textArea.style.setProperty('height', '1px');
  textArea.style.setProperty('margin-bottom', '-1px');
  textArea.style.setProperty('margin-right', '-1px');
  textArea.style.setProperty('max-height', '1px');
  textArea.style.setProperty('max-width', '1px');
  textArea.style.setProperty('min-height', '1px');
  textArea.style.setProperty('min-width', '1px');
  textArea.style.setProperty('outline-color', 'transparent');
  textArea.style.setProperty('position', 'absolute');
  textArea.style.setProperty('width', '1px');
  document.body.appendChild(textArea);
  return textArea;
}

function removeElement(element: HTMLElement): void {
  element.parentNode!.removeChild(element);
}

function write(text: string): void {
  const textArea: HTMLTextAreaElement = createTextArea();
  textArea.value = text;
  textArea.select();
  const success: boolean = document.execCommand('copy');
  removeElement(textArea);
  if (!success) {
    throw new Error('NotAllowed');
  }
}

export function useCopyToClipboard(): (text: string) => Promise<void> {
  const [, setClipboard] = React.useState('');

  const copyToClipboard = React.useCallback(
    async (text: string): Promise<void> => {
      if (isClipboardApiEnabled(navigator)) {
        try {
          await navigator.clipboard.writeText(text);
          setClipboard(text);
        } catch {
          try {
            write(text);
            setClipboard(text);
            // eslint-disable-next-line no-empty
          } catch {}
        }
      }
    },
    []
  );

  return copyToClipboard;
}
