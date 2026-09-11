import { DetectedFormField, FormPageType } from '../shared/types';

/**
 * Detects the contextual domain of the current webpage:
 * - Google Form
 * - Job Application (Greenhouse, Lever, Workday, LinkedIn, careers sites)
 * - Flight & Travel Booking (Airline checkout, passenger details)
 * - Generic Web Form
 */
export function detectPageType(): FormPageType {
  const url = window.location.href.toLowerCase();
  const pageTitle = document.title.toLowerCase();
  const bodyText = document.body ? document.body.innerText.slice(0, 3000).toLowerCase() : '';

  if (url.includes('docs.google.com/forms')) {
    return 'google_form';
  }

  // Job Search / Application check
  const jobKeywords = [
    'greenhouse.io',
    'jobs.lever.co',
    'myworkdayjobs',
    'smartrecruiters',
    'apply',
    'application',
    'career',
    'resume',
    'curriculum vitae',
    'cover letter',
    'candidate'
  ];
  if (jobKeywords.some((k) => url.includes(k) || pageTitle.includes(k))) {
    return 'job_application';
  }

  // Flight / Travel Booking check
  const flightKeywords = [
    'flight',
    'passenger',
    'booking',
    'airline',
    'traveler',
    'passport',
    'seat selection',
    'depart',
    'return'
  ];
  if (
    flightKeywords.some((k) => url.includes(k) || pageTitle.includes(k)) ||
    (bodyText.includes('passenger') && (bodyText.includes('flight') || bodyText.includes('passport')))
  ) {
    return 'flight_booking';
  }

  return 'generic_web_form';
}

/**
 * Strictly identifies sensitive security, password, OTP, CVV, PIN, or auth fields
 * that must NEVER be detected, matched, or autofilled.
 */
export function isForbiddenSecurityField(el: HTMLElement, label: string, name: string): boolean {
  const type = (el.getAttribute('type') || '').toLowerCase();
  if (type === 'password') return true;

  const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
  const forbiddenAutocomplete = [
    'current-password',
    'new-password',
    'one-time-code',
    'cc-csc',
    'cc-exp',
    'cc-number',
    'transaction-currency',
    'transaction-amount'
  ];
  if (forbiddenAutocomplete.some((a) => autocomplete.includes(a))) return true;

  const combined = `${label} ${name} ${el.id || ''} ${el.getAttribute('placeholder') || ''}`.toLowerCase();
  const forbiddenPatterns = [
    /\bpassword\b/,
    /\bpasswd\b/,
    /\bpwd\b/,
    /\bconfirm password\b/,
    /\botp\b/,
    /\bone time (?:password|code|pin)\b/,
    /\bpasscode\b/,
    /\bsecurity code\b/,
    /\bverification code\b/,
    /\bcvv\b/,
    /\bcvc\b/,
    /\bcard verification\b/,
    /\bbanking pin\b/,
    /\bcard pin\b/,
    /\batm pin\b/,
    /\bapi[_\s-]?key\b/,
    /\bsecret[_\s-]?key\b/,
    /\bprivate[_\s-]?key\b/,
    /\bauth[_\s-]?token\b/,
    /\bbearer token\b/,
    /\baccess[_\s-]?token\b/,
    /\bsecurity answer\b/,
    /\bsecurity question\b/,
    /\bmother'?s? maiden name\b/,
    /\bcaptcha\b/
  ];

  return forbiddenPatterns.some((pat) => pat.test(combined));
}

function escapeSelector(val: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(val);
  }
  return val.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|\/@])/g, '\\$1');
}

/**
 * Extracts label for a standard or custom HTML form element.
 */
export function extractElementLabel(el: HTMLElement): string {
  // 1. Explicit <label for="...">
  if (el.id) {
    const labelEl = document.querySelector(`label[for="${escapeSelector(el.id)}"]`);
    if (labelEl && labelEl.textContent?.trim()) {
      return cleanLabelText(labelEl.textContent);
    }
  }

  // 2. Wrapping <label>
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    return cleanLabelText(parentLabel.textContent);
  }

  // 3. aria-label or aria-labelledby
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return cleanLabelText(ariaLabel);
  }

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const refEl = document.getElementById(ariaLabelledBy);
    if (refEl && refEl.textContent?.trim()) {
      return cleanLabelText(refEl.textContent);
    }
  }

  // 4. Floating label / sibling label (Material UI, Bootstrap, Tailwind)
  const container = el.parentElement;
  if (container) {
    const siblingLabel = container.querySelector('label, span.label, div.label');
    if (siblingLabel && siblingLabel.textContent?.trim()) {
      return cleanLabelText(siblingLabel.textContent);
    }
    // Check previous element sibling
    const prevSibling = el.previousElementSibling;
    if (prevSibling && /^(label|span|p)$/i.test(prevSibling.tagName) && prevSibling.textContent?.trim()) {
      return cleanLabelText(prevSibling.textContent);
    }
  }

  // 5. Placeholder
  const placeholder = el.getAttribute('placeholder');
  if (placeholder && placeholder.trim() && !/^(enter|type here|search|\.{3})/i.test(placeholder)) {
    return cleanLabelText(placeholder);
  }

  // 6. Name attribute
  const name = el.getAttribute('name');
  if (name && name.trim()) {
    return cleanLabelText(name.replace(/[-_]/g, ' '));
  }

  return '';
}

function cleanLabelText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[*:]/g, '')
    .trim();
}

/**
 * Extracts surrounding context such as fieldset legend or nearest preceding header.
 */
export function extractElementContext(el: HTMLElement): string {
  const fieldset = el.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend && legend.textContent?.trim()) {
      return legend.textContent.trim();
    }
  }

  const section = el.closest('section, div[class*="section"], div[class*="card"], div[class*="group"]');
  if (section) {
    const heading = section.querySelector('h1, h2, h3, h4, h5, .title, .header');
    if (heading && heading.textContent?.trim()) {
      return heading.textContent.trim().slice(0, 50);
    }
  }

  return '';
}

export function isElementVisible(el: HTMLElement): boolean {
  if (el.hasAttribute('hidden')) return false;
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
  if (typeof window.getComputedStyle === 'function') {
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
    } catch {}
  }
  // In real browser with layout engine where document.body has rendered dimensions:
  if (document.body && (document.body.offsetWidth > 0 || document.body.offsetHeight > 0)) {
    if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) {
      return false;
    }
  }
  return true;
}

/**
 * Scans document for generic HTML inputs, custom ARIA comboboxes, and custom controls.
 * Strictly excludes hidden, disabled, read-only, submit, and CSRF elements.
 */
export function detectGenericFormFields(): DetectedFormField[] {
  const detected: DetectedFormField[] = [];
  const processedNames = new Set<string>();
  let counter = 0;

  // 1. Scan for Modern Custom Comboboxes / Dropdowns (role="combobox" or aria-haspopup="listbox")
  const comboboxes = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="combobox"], [aria-haspopup="listbox"], div.custom-combobox, div[data-combobox]'
    )
  );

  for (const cb of comboboxes) {
    // Exclude hidden or disabled comboboxes
    if (cb.getAttribute('aria-disabled') === 'true' || cb.hasAttribute('disabled')) continue;
    if (!isElementVisible(cb)) continue;

    const fieldId = `ff_combobox_${counter++}`;
    cb.setAttribute('data-formfill-id', fieldId);

    const label = extractElementLabel(cb);
    const context = extractElementContext(cb);

    // Try to find options associated with listbox
    const options: { label: string; value: string }[] = [];
    const controlsId = cb.getAttribute('aria-controls') || cb.getAttribute('aria-owns');
    let listbox: HTMLElement | null = null;
    if (controlsId) {
      listbox = document.getElementById(controlsId);
    }
    if (!listbox) {
      listbox = cb.parentElement?.querySelector('[role="listbox"]') || null;
    }

    if (listbox) {
      const optionElements = listbox.querySelectorAll('[role="option"], li, div[data-value]');
      optionElements.forEach((opt, idx) => {
        const text = opt.textContent?.trim() || `Option ${idx + 1}`;
        const val = opt.getAttribute('data-value') || text;
        options.push({ label: text, value: val });
      });
    }

    detected.push({
      id: fieldId,
      label: label || 'Choose option',
      type: 'combobox',
      isCombobox: true,
      options: options.length > 0 ? options : undefined,
      required: cb.getAttribute('aria-required') === 'true',
      context
    });
  }

  // 2. Scan Standard Inputs, Textareas, Selects, and Custom Checkboxes/Radios
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      'input, select, textarea, [role="radio"], [role="checkbox"]'
    )
  );

  for (const el of elements) {
    const tagName = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || el.getAttribute('role') || tagName).toLowerCase();

    // Strictly exclude hidden, submit, reset, file, image, and search button types
    if (
      type === 'hidden' ||
      type === 'submit' ||
      type === 'button' ||
      type === 'reset' ||
      type === 'image' ||
      type === 'file'
    ) {
      continue;
    }

    // Strictly exclude disabled or read-only elements
    if (
      el.hasAttribute('disabled') ||
      el.hasAttribute('readonly') ||
      el.getAttribute('aria-disabled') === 'true' ||
      el.getAttribute('aria-readonly') === 'true'
    ) {
      continue;
    }

    // Strictly exclude hidden from view
    if (!isElementVisible(el)) {
      continue;
    }

    // Skip if element was already processed as a combobox child/trigger
    if (el.closest('[role="combobox"]') && el !== el.closest('[role="combobox"]')) {
      continue;
    }

    const name = el.getAttribute('name') || '';
    // Skip CSRF and security tokens
    if (/csrf|xsrf|token|_wpnonce|authenticity/i.test(name)) {
      continue;
    }

    const label = extractElementLabel(el);
    const context = extractElementContext(el);
    const autocomplete = el.getAttribute('autocomplete') || undefined;
    const placeholder = el.getAttribute('placeholder') || undefined;
    const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

    // CRITICAL SAFETY RULE: Never autofill passwords, OTP, CVV, PINs, API keys, or security answers
    if (isForbiddenSecurityField(el, label, name)) {
      continue;
    }

    // Detect if field already contains an existing non-empty value
    let existingValue: string | undefined;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el.value && el.value.trim().length > 0) {
        existingValue = el.value.trim();
      }
    } else if (el instanceof HTMLSelectElement) {
      if (el.selectedIndex > 0 && el.value && el.value.trim().length > 0) {
        existingValue = el.options[el.selectedIndex]?.text?.trim() || el.value.trim();
      }
    }
    const hasExistingValue = Boolean(existingValue);

    // A. Radio Buttons (native and role="radio")
    if (type === 'radio') {
      if (name && processedNames.has(name)) {
        continue;
      }
      if (name) processedNames.add(name);

      const radioGroup = name
        ? Array.from(document.querySelectorAll<HTMLElement>(`[name="${escapeSelector(name)}"]`))
        : [el];

      const options: { label: string; value: string }[] = [];
      const fieldId = `ff_radio_${counter++}`;

      radioGroup.forEach((r, idx) => {
        const optLabel = extractElementLabel(r) || r.getAttribute('value') || `Option ${idx + 1}`;
        const val = r.getAttribute('value') || optLabel;
        options.push({ label: optLabel, value: val });
        r.setAttribute('data-formfill-id', fieldId);
        r.setAttribute('data-formfill-radio-val', val);
      });

      detected.push({
        id: fieldId,
        label: label || name || 'Choose Option',
        name: name || undefined,
        type: 'radio',
        options,
        required,
        context,
        isCustomControl: el.getAttribute('role') === 'radio'
      });
      continue;
    }

    // B. Checkboxes (native and role="checkbox")
    if (type === 'checkbox') {
      const fieldId = `ff_check_${counter++}`;
      el.setAttribute('data-formfill-id', fieldId);

      detected.push({
        id: fieldId,
        label: label || placeholder || name || 'Checkbox',
        name: name || undefined,
        type: 'checkbox',
        required,
        context,
        isCustomControl: el.getAttribute('role') === 'checkbox'
      });
      continue;
    }

    // C. Select Dropdowns
    if (tagName === 'select') {
      const selectEl = el as HTMLSelectElement;
      const fieldId = `ff_select_${counter++}`;
      selectEl.setAttribute('data-formfill-id', fieldId);

      const options = Array.from(selectEl.options).map((opt) => ({
        label: opt.text.trim(),
        value: opt.value
      }));

      detected.push({
        id: fieldId,
        label: label || name || 'Select',
        name: name || undefined,
        type: 'select',
        options,
        required,
        context,
        autocomplete,
        hasExistingValue,
        existingValue
      });
      continue;
    }

    // D. Text / Email / Tel / Date / Number / Textarea
    const fieldId = `ff_input_${counter++}`;
    el.setAttribute('data-formfill-id', fieldId);

    let normType: DetectedFormField['type'] = 'text';
    if (tagName === 'textarea') normType = 'textarea';
    else if (type === 'email') normType = 'email';
    else if (type === 'tel') normType = 'tel';
    else if (type === 'date') normType = 'date';
    else if (type === 'number') normType = 'number';

    detected.push({
      id: fieldId,
      label: label || placeholder || name || `Field ${counter}`,
      name: name || undefined,
      placeholder,
      autocomplete,
      type: normType,
      required,
      context,
      hasExistingValue,
      existingValue
    });
  }

  return detected;
}
