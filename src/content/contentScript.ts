import { scanPageForms } from './formExtractor';
import { fillAllMatchedFields } from './formFiller';
import { FormFieldMatchItem } from '../shared/types';


function escapeSelector(val: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(val);
  }
  return val.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|\/@])/g, '\\$1');
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'SCAN_FORM') {
    try {
      const scanResult = scanPageForms();
      sendResponse({ success: true, data: scanResult });
    } catch (err) {
      console.error('[FormFill Helper] Error scanning form:', err);
      sendResponse({ success: false, error: String(err) });
    }
    return true;
  }

  if (message.action === 'FILL_FORM') {
    try {
      const matches = message.matches as FormFieldMatchItem[];
      const result = fillAllMatchedFields(matches);
      sendResponse({ success: true, ...result });
    } catch (err) {
      console.error('[FormFill Helper] Error filling form:', err);
      sendResponse({ success: false, error: String(err) });
    }
    return true;
  }

  if (message.action === 'HIGHLIGHT_FIELD') {
    const fieldId = message.fieldId as string;
    const el = document.querySelector<HTMLElement>(`[data-formfill-id="${escapeSelector(fieldId)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const origOutline = el.style.outline;
      const origTransition = el.style.transition;
      el.style.transition = 'outline 0.2s ease-in-out';
      el.style.outline = '3px solid #4f46e5';
      setTimeout(() => {
        el.style.outline = origOutline;
        el.style.transition = origTransition;
      }, 1800);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }

  return false;
});
