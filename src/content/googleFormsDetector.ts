import { DetectedFormField } from '../shared/types';

/**
 * Specialized detector for Google Forms DOM structure.
 * Inspects list items, custom radio groups, checkboxes, and text inputs.
 */
export function isGoogleFormsPage(): boolean {
  return (
    window.location.hostname === 'docs.google.com' &&
    window.location.pathname.includes('/forms')
  );
}

export function detectGoogleFormsQuestions(): DetectedFormField[] {
  const detected: DetectedFormField[] = [];

  // Google Forms groups each question in a container, typically div[role="listitem"]
  const questionBlocks = document.querySelectorAll('div[role="listitem"]');

  questionBlocks.forEach((block, index) => {
    // Extract Question Title
    const titleEl =
      block.querySelector('div[role="heading"]') ||
      block.querySelector('.M7eMe') ||
      block.querySelector('.HoPnR');

    const label = titleEl?.textContent?.replace(/\*/g, '').trim() || `Question ${index + 1}`;
    const isRequired = Boolean(block.querySelector('.vnumgf') || titleEl?.textContent?.includes('*'));

    // Check for Text Input / Paragraph (textarea)
    const textInput = block.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="date"], textarea'
    );

    if (textInput) {
      const fieldId = `gform_input_${index}`;
      textInput.setAttribute('data-formfill-id', fieldId);

      let inputType: DetectedFormField['type'] = 'text';
      if (textInput.tagName.toLowerCase() === 'textarea') inputType = 'textarea';
      else if (textInput.type === 'email') inputType = 'email';
      else if (textInput.type === 'tel') inputType = 'tel';
      else if (textInput.type === 'date') inputType = 'date';
      else if (textInput.type === 'number') inputType = 'number';

      detected.push({
        id: fieldId,
        label,
        name: textInput.name || undefined,
        placeholder: textInput.placeholder || undefined,
        type: inputType,
        required: isRequired,
        isGoogleFormsCustom: true,
        context: 'Google Form'
      });
      return;
    }

    // Check for Radio group (Multiple Choice)
    const radioElements = block.querySelectorAll('div[role="radio"]');
    if (radioElements.length > 0) {
      const fieldId = `gform_radio_${index}`;
      block.setAttribute('data-formfill-id', fieldId);

      const options: { label: string; value: string }[] = [];
      radioElements.forEach((r, rIdx) => {
        const optLabel =
          r.getAttribute('aria-label') ||
          r.closest('label')?.textContent?.trim() ||
          r.textContent?.trim() ||
          `Option ${rIdx + 1}`;
        options.push({ label: optLabel, value: optLabel });
        r.setAttribute('data-formfill-radio-idx', String(rIdx));
      });

      detected.push({
        id: fieldId,
        label,
        type: 'radio',
        options,
        required: isRequired,
        isGoogleFormsCustom: true,
        context: 'Google Form'
      });
      return;
    }

    // Check for Checkboxes
    const checkboxElements = block.querySelectorAll('div[role="checkbox"]');
    if (checkboxElements.length > 0) {
      const fieldId = `gform_check_${index}`;
      block.setAttribute('data-formfill-id', fieldId);

      const options: { label: string; value: string }[] = [];
      checkboxElements.forEach((c, cIdx) => {
        const optLabel =
          c.getAttribute('aria-label') ||
          c.closest('label')?.textContent?.trim() ||
          c.textContent?.trim() ||
          `Option ${cIdx + 1}`;
        options.push({ label: optLabel, value: optLabel });
        c.setAttribute('data-formfill-check-idx', String(cIdx));
      });

      detected.push({
        id: fieldId,
        label,
        type: 'checkbox',
        options,
        required: isRequired,
        isGoogleFormsCustom: true,
        context: 'Google Form'
      });
      return;
    }

    // Check for Dropdown (Listbox)
    const dropdown = block.querySelector('div[role="listbox"]');
    if (dropdown) {
      const fieldId = `gform_select_${index}`;
      dropdown.setAttribute('data-formfill-id', fieldId);

      detected.push({
        id: fieldId,
        label,
        type: 'select',
        required: isRequired,
        isGoogleFormsCustom: true,
        context: 'Google Form'
      });
    }
  });

  return detected;
}
