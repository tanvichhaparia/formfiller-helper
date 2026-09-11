import { FormFieldMatchItem, FillVerificationResult, FailedFieldVerification } from '../shared/types';

/**
 * Universal Form Filling Engine
 * Dispatches simulated DOM events so reactive frameworks (React, Vue, Angular)
 * and Google Forms internal handlers register changes properly without submitting.
 */

function escapeSelector(val: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(val);
  }
  return val.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|\/@])/g, '\\$1');
}

export function simulateInputEvents(element: HTMLElement, value: string): void {
  element.focus();

  if (element instanceof HTMLInputElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(element, value);
    } else {
      element.value = value;
    }
  } else if (element instanceof HTMLTextAreaElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(element, value);
    } else {
      element.value = value;
    }
  }

  // Dispatch full lifecycle events recognized by React, Vue 3, Angular Reactive Forms
  element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
  element.blur();
}

/**
 * Handles filling modern custom dropdowns/comboboxes (role="combobox", role="option")
 */
function fillComboboxField(element: HTMLElement, value: string): boolean {
  const targetNorm = value.toLowerCase().trim();

  // 1. If the combobox has an embedded or inner input, type into it
  const innerInput = element.tagName.toLowerCase() === 'input'
    ? (element as HTMLInputElement)
    : element.querySelector<HTMLInputElement>('input');

  if (innerInput) {
    simulateInputEvents(innerInput, value);
  }

  // 2. Click combobox to open popup listbox if needed
  element.click();
  element.dispatchEvent(new Event('focus', { bubbles: true }));

  // 3. Search for matching option in the DOM
  const controlsId = element.getAttribute('aria-controls') || element.getAttribute('aria-owns');
  let searchContainer: HTMLElement | Document = document;
  if (controlsId) {
    const listbox = document.getElementById(controlsId);
    if (listbox) searchContainer = listbox;
  }

  const optionElements = Array.from(
    searchContainer.querySelectorAll<HTMLElement>('[role="option"], li.option, div.option, [data-option]')
  );

  let matchedOption: HTMLElement | null = null;
  for (const opt of optionElements) {
    const optText = (opt.textContent || '').toLowerCase().trim();
    const optVal = (opt.getAttribute('data-value') || '').toLowerCase().trim();
    if (optText === targetNorm || optVal === targetNorm || optText.includes(targetNorm)) {
      matchedOption = opt;
      break;
    }
  }

  if (matchedOption) {
    matchedOption.click();
    matchedOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    matchedOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // If combobox held an inner input and we set its value, consider it filled
  if (innerInput && innerInput.value === value) {
    return true;
  }

  return false;
}

export function fillField(matchItem: FormFieldMatchItem): boolean {
  if (!matchItem.enabled || !matchItem.assignedValue) {
    return false;
  }

  const { detectedField, assignedValue } = matchItem;
  const targetId = detectedField.id;

  // 1. Google Forms custom controls
  if (detectedField.isGoogleFormsCustom) {
    return fillGoogleFormsField(detectedField, assignedValue);
  }

  // 2. Standard or Custom DOM element by data-formfill-id
  const targetEl = document.querySelector<HTMLElement>(`[data-formfill-id="${escapeSelector(targetId)}"]`);
  if (!targetEl) {
    return false;
  }

  // A. Combobox / Custom Dropdown
  if (detectedField.type === 'combobox' || detectedField.isCombobox) {
    return fillComboboxField(targetEl, assignedValue);
  }

  // B. Native Select Dropdown
  if (targetEl.tagName.toLowerCase() === 'select') {
    const select = targetEl as HTMLSelectElement;
    const targetNorm = assignedValue.toLowerCase().trim();

    let matchedOptionIndex = -1;
    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const optText = opt.text.toLowerCase().trim();
      const optVal = opt.value.toLowerCase().trim();

      if (optText === targetNorm || optVal === targetNorm || optText.includes(targetNorm)) {
        matchedOptionIndex = i;
        break;
      }
    }

    if (matchedOptionIndex !== -1) {
      select.selectedIndex = matchedOptionIndex;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  // C. Radio Button Group (Native & role="radio")
  if (detectedField.type === 'radio') {
    const radioInputs = document.querySelectorAll<HTMLElement>(
      `[data-formfill-id="${escapeSelector(targetId)}"]`
    );
    const targetNorm = assignedValue.toLowerCase().trim();

    for (const r of Array.from(radioInputs)) {
      const val = (r.getAttribute('data-formfill-radio-val') || r.getAttribute('value') || '').toLowerCase().trim();
      const label = (r.closest('label')?.textContent || r.textContent || '').toLowerCase().trim();

      if (val === targetNorm || label.includes(targetNorm)) {
        if (r instanceof HTMLInputElement) {
          r.checked = true;
        } else {
          r.setAttribute('aria-checked', 'true');
        }
        r.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        r.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // D. Checkbox (Native & role="checkbox")
  if (detectedField.type === 'checkbox') {
    const shouldCheck = /^(yes|true|1|agree|on)$/i.test(assignedValue.trim());
    if (targetEl instanceof HTMLInputElement) {
      targetEl.checked = shouldCheck;
    } else {
      targetEl.setAttribute('aria-checked', shouldCheck ? 'true' : 'false');
    }
    targetEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    targetEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // E. Standard Text / Email / Tel / Date / Number / Textarea
  simulateInputEvents(targetEl, assignedValue);
  return true;
}

function fillGoogleFormsField(
  detectedField: FormFieldMatchItem['detectedField'],
  value: string
): boolean {
  const targetId = detectedField.id;

  // Text inputs & Textareas
  const inputEl = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[data-formfill-id="${escapeSelector(targetId)}"]`
  );
  if (inputEl) {
    simulateInputEvents(inputEl, value);
    return true;
  }

  // Radio button in Google Forms
  if (detectedField.type === 'radio') {
    const container = document.querySelector(`[data-formfill-id="${escapeSelector(targetId)}"]`);
    if (!container) return false;

    const radioItems = container.querySelectorAll<HTMLElement>('div[role="radio"]');
    const targetNorm = value.toLowerCase().trim();

    for (const r of Array.from(radioItems)) {
      const optText = (r.getAttribute('aria-label') || r.textContent || '').toLowerCase().trim();
      if (optText.includes(targetNorm) || targetNorm.includes(optText)) {
        r.click();
        return true;
      }
    }
  }

  // Checkbox in Google Forms
  if (detectedField.type === 'checkbox') {
    const container = document.querySelector(`[data-formfill-id="${escapeSelector(targetId)}"]`);
    if (!container) return false;

    const checkItems = container.querySelectorAll<HTMLElement>('div[role="checkbox"]');
    const targetNorm = value.toLowerCase().trim();

    for (const c of Array.from(checkItems)) {
      const optText = (c.getAttribute('aria-label') || c.textContent || '').toLowerCase().trim();
      if (optText.includes(targetNorm) || targetNorm.includes(optText)) {
        c.click();
        return true;
      }
    }
  }

  return false;
}

/**
 * Post-fill verification step:
 * Inspects DOM elements to verify whether the actual value matches the intended value.
 */
export function verifyFilledFields(matches: FormFieldMatchItem[]): FillVerificationResult {
  const failedFields: FailedFieldVerification[] = [];
  let successCount = 0;
  let totalAttempted = 0;

  for (const item of matches) {
    if (!item.enabled || !item.assignedValue) continue;

    totalAttempted++;
    const targetEl = document.querySelector<HTMLElement>(
      `[data-formfill-id="${escapeSelector(item.detectedField.id)}"]`
    );

    if (!targetEl) {
      failedFields.push({
        fieldId: item.detectedField.id,
        label: item.detectedField.label,
        expected: item.assignedValue,
        actual: '',
        reason: 'Element not found in DOM after fill'
      });
      continue;
    }

    const expected = item.assignedValue.trim();
    let actual = '';

    if (targetEl instanceof HTMLInputElement || targetEl instanceof HTMLTextAreaElement) {
      actual = targetEl.value.trim();
    } else if (targetEl instanceof HTMLSelectElement) {
      const selected = targetEl.options[targetEl.selectedIndex];
      actual = selected ? selected.text.trim() : '';
    } else if (targetEl.getAttribute('role') === 'checkbox') {
      actual = targetEl.getAttribute('aria-checked') || '';
    } else if (targetEl.getAttribute('role') === 'combobox') {
      const input = targetEl.querySelector<HTMLInputElement>('input');
      actual = input ? input.value.trim() : (targetEl.textContent || '').trim();
    } else {
      actual = (targetEl.textContent || '').trim();
    }

    const isMatch =
      actual === expected ||
      actual.toLowerCase() === expected.toLowerCase() ||
      actual.toLowerCase().includes(expected.toLowerCase()) ||
      expected.toLowerCase().includes(actual.toLowerCase());

    if (isMatch) {
      successCount++;
    } else {
      failedFields.push({
        fieldId: item.detectedField.id,
        label: item.detectedField.label,
        expected,
        actual,
        reason: `Value mismatch (Expected: "${expected}", Actual: "${actual}")`
      });
    }
  }

  return {
    totalAttempted,
    successCount,
    failedCount: failedFields.length,
    failedFields
  };
}

/**
 * Fills all matched fields and performs post-fill verification.
 */
export function fillAllMatchedFields(matches: FormFieldMatchItem[]): FillVerificationResult {
  for (const item of matches) {
    if (item.enabled && item.assignedValue) {
      fillField(item);
    }
  }

  // Execute post-fill verification
  return verifyFilledFields(matches);
}
