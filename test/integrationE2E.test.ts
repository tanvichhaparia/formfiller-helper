import { JSDOM } from 'jsdom';
import { detectGenericFormFields } from '../src/content/genericFormDetector';
import { matchAllDetectedFields, matchQuestionToField } from '../src/matching/questionMatcher';
import { fillAllMatchedFields, fillField, verifyFilledFields } from '../src/content/formFiller';
import { getDefaultStorageState } from '../src/profile/defaultFields';
import { addCustomField, getActiveProfile } from '../src/profile/profileStore';
import { FormFieldMatchItem } from '../src/shared/types';

async function runIntegrationE2ETests() {
  console.log('\n=============================================================');
  console.log('  Universal FormFill Helper — Full Integration & E2E Tests');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // Setup base profile data
  const state = getDefaultStorageState();
  const profile = state.profiles['profile_personal'];
  profile.fields['firstName'].value = 'Rahul';
  profile.fields['lastName'].value = 'Kumar';
  profile.fields['email'].value = 'rahul@example.com';
  profile.fields['phone'].value = '+1 555-0199';
  profile.fields['passportNumber'].value = 'A98765432';
  profile.fields['passportExpiry'].value = '2030-05-15';
  profile.fields['passportCountry'].value = 'United States';
  profile.fields['emergencyContactName'].value = 'Priya Kumar';
  profile.fields['emergencyContactPhone'].value = '+1 555-0177';
  profile.fields['noticePeriod'].value = '30 Days';

  // -------------------------------------------------------------------------
  // Test 1: React-Controlled Input with Internal Synthetic State Update
  // -------------------------------------------------------------------------
  console.log('--- Test 1: React-Controlled Form Input State Synchronization ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <form id="react-form">
        <label for="fname">First Name</label>
        <input id="fname" type="text" name="first_name" autocomplete="given-name" />
      </form>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
    (global as any).Event = dom.window.Event;
    (global as any).CustomEvent = dom.window.CustomEvent;
    (global as any).KeyboardEvent = dom.window.KeyboardEvent;
    (global as any).MouseEvent = dom.window.MouseEvent;

    const input = dom.window.document.getElementById('fname') as HTMLInputElement;

    // Simulate React 16+ controlled component tracking internal state
    let reactInternalState = '';
    input.addEventListener('input', (e: any) => {
      reactInternalState = e.target.value;
    });

    const fields = detectGenericFormFields();
    assert('Detected React input', fields.length === 1 && fields[0].label === 'First Name');

    const matches = matchAllDetectedFields(fields, profile);
    assert('Matched firstName with high confidence', matches[0].selectedFieldKey === 'firstName');

    // Execute filling
    fillField(matches[0]);

    assert('Visible DOM value updated', input.value === 'Rahul');
    assert('React internal state updated via simulated input event', reactInternalState === 'Rahul');
  }

  // -------------------------------------------------------------------------
  // Test 2: Modern ARIA Combobox / Custom Dropdown (role="combobox", role="option")
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Modern Custom Dropdowns / Comboboxes (role="combobox") ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <label id="cb-label">Notice Period</label>
      <div id="my-combobox" role="combobox" aria-labelledby="cb-label" aria-controls="cb-listbox" tabindex="0">
        <input type="text" placeholder="Select notice" />
      </div>
      <ul id="cb-listbox" role="listbox">
        <li role="option" data-value="Immediate">Immediate</li>
        <li role="option" data-value="30 Days">30 Days</li>
        <li role="option" data-value="60 Days">60 Days</li>
      </ul>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
    (global as any).Event = dom.window.Event;
    (global as any).KeyboardEvent = dom.window.KeyboardEvent;
    (global as any).MouseEvent = dom.window.MouseEvent;

    const fields = detectGenericFormFields();
    const cbField = fields.find((f) => f.type === 'combobox');
    assert('Detected custom combobox element', Boolean(cbField));

    if (cbField) {
      const match = matchQuestionToField(cbField, profile);
      assert('Matched combobox to noticePeriod', match.selectedFieldKey === 'noticePeriod');

      let optionClicked = false;
      const option30 = dom.window.document.querySelector('li[data-value="30 Days"]') as HTMLElement;
      option30.addEventListener('click', () => {
        optionClicked = true;
      });

      fillField(match);
      assert('Combobox option was clicked and filled', optionClicked);
    }
  }

  // -------------------------------------------------------------------------
  // Test 3: Stronger Safety Handling for Sensitive Fields (Explicit Opt-In)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Sensitive Fields Safety & Explicit Opt-In Safeguard ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <form>
        <label for="pass_no">Passport Number</label>
        <input id="pass_no" type="text" />
        <label for="pass_exp">Passport Expiry Date</label>
        <input id="pass_exp" type="date" />
        <label for="em_phone">Emergency Contact Phone</label>
        <input id="em_phone" type="tel" />
      </form>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;

    const fields = detectGenericFormFields();
    const matches = matchAllDetectedFields(fields, profile);

    for (const m of matches) {
      assert(
        `Field "${m.detectedField.label}" flagged as sensitive`,
        m.isSensitive === true && m.requiresExplicitOptIn === true
      );
      assert(
        `Field "${m.detectedField.label}" is NOT enabled by default (Explicit Opt-In required)`,
        m.enabled === false
      );
    }

    // Verify filling without opt-in does not fill sensitive DOM element
    fillAllMatchedFields(matches);
    const passInput = dom.window.document.getElementById('pass_no') as HTMLInputElement;
    assert('Sensitive field remained unfilled without user opt-in', passInput.value === '');

    // Now simulate user explicitly checking the opt-in box
    matches[0].enabled = true;
    fillAllMatchedFields(matches);
    assert('Sensitive field filled after explicit user opt-in', passInput.value === 'A98765432');
  }

  // -------------------------------------------------------------------------
  // Test 4: Behavior-Driven Confidence Thresholds
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4: Behavior-Driven Confidence Tiers ---');
  {
    // High confidence (>= 0.95): exact email
    const highMatch = matchQuestionToField({ id: '1', label: 'Email Address', type: 'email' }, profile);
    assert('95%+ confidence is tier="high"', highMatch.confidenceTier === 'high');
    assert('High confidence non-sensitive field is enabled by default', highMatch.enabled === true);

    // Review tier (0.85 - 0.94): context-boosted keyword match
    const reviewMatch = matchQuestionToField({ id: '2', label: 'Please provide your first name', context: 'applicant details', type: 'text' }, profile);
    assert('85-94% confidence is tier="review"', reviewMatch.confidenceTier === 'review');

    // Manual tier (0.70 - 0.84): standard keyword match without context boost
    const manualMatch = matchQuestionToField({ id: '3', label: 'Please enter your first name', type: 'text' }, profile);
    assert('70-84% confidence is tier="manual"', manualMatch.confidenceTier === 'manual');
    assert('Manual tier requires explicit confirmation (enabled === false)', manualMatch.enabled === false);

    // Below 70%: essay question
    const lowMatch = matchQuestionToField({ id: '4', label: 'Why do you want to join our company?', type: 'textarea' }, profile);
    assert('Below 70% confidence is tier="none"', lowMatch.confidenceTier === 'none');
    assert('Below 70% is NOT matched or enabled', lowMatch.enabled === false && lowMatch.selectedFieldKey === undefined);
  }

  // -------------------------------------------------------------------------
  // Test 5: Hidden, Disabled, and Readonly Elements Strictly Excluded
  // -------------------------------------------------------------------------
  console.log('\n--- Test 5: Strict Exclusion of Hidden, Disabled, and Read-only Elements ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <form>
        <input type="hidden" name="csrf_token" value="secret123" />
        <input type="text" name="visible_field" placeholder="Visible Field" />
        <input type="text" name="disabled_field" placeholder="Disabled Field" disabled />
        <input type="text" name="readonly_field" placeholder="Readonly Field" readonly />
        <input type="text" name="aria_disabled" placeholder="Aria Disabled" aria-disabled="true" />
      </form>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;

    const fields = detectGenericFormFields();
    assert('Only 1 visible active field detected (all hidden/disabled/readonly skipped)', fields.length === 1);
    assert('Detected field is the active visible field', fields[0].placeholder === 'Visible Field');
  }

  // -------------------------------------------------------------------------
  // Test 6: Custom Radio Buttons & Custom Checkboxes (role="radio", role="checkbox")
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Custom Radio & Checkbox Controls (ARIA roles) ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <label id="reloc-label">Willing to Relocate</label>
      <div role="radio" name="relocate" value="Yes" aria-labelledby="reloc-label">Yes</div>
      <div role="radio" name="relocate" value="No" aria-labelledby="reloc-label">No</div>
      <div role="checkbox" id="terms" aria-checked="false">I agree to the terms</div>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
    (global as any).MouseEvent = dom.window.MouseEvent;
    (global as any).Event = dom.window.Event;

    const fields = detectGenericFormFields();
    assert('Detected custom radio group and checkbox', fields.length === 2);

    const checkField = fields.find((f) => f.type === 'checkbox')!;
    const matchItem: FormFieldMatchItem = {
      detectedField: checkField,
      assignedValue: 'yes',
      confidence: 1.0,
      confidenceTier: 'high',
      matchReason: 'Agreed',
      candidates: [],
      enabled: true
    };

    fillField(matchItem);
    const checkboxEl = dom.window.document.getElementById('terms');
    assert('Custom checkbox aria-checked updated to "true"', checkboxEl?.getAttribute('aria-checked') === 'true');
  }

  // -------------------------------------------------------------------------
  // Test 7: Dynamically Generated Fields (AJAX / Multi-Step Forms)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Dynamically Generated Fields (AJAX / Step 2) ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="form-container">
        <label for="step1_email">Email</label>
        <input id="step1_email" type="email" />
      </div>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;

    // Step 1
    let fields = detectGenericFormFields();
    assert('Step 1 detected initial field', fields.length === 1);

    // Simulate AJAX call completing and rendering Step 2
    const container = dom.window.document.getElementById('form-container')!;
    const step2Div = dom.window.document.createElement('div');
    step2Div.innerHTML = `
      <label for="step2_phone">Phone Number</label>
      <input id="step2_phone" type="tel" />
      <label for="step2_notice">Notice Period</label>
      <input id="step2_notice" type="text" />
    `;
    container.appendChild(step2Div);

    // Rescan after AJAX update
    fields = detectGenericFormFields();
    assert('Rescan discovered dynamic AJAX fields', fields.length === 3);

    const matches = matchAllDetectedFields(fields, profile);
    const noticeMatch = matches.find((m) => m.selectedFieldKey === 'noticePeriod');
    assert('Dynamic field matched noticePeriod properly', Boolean(noticeMatch));
  }

  // -------------------------------------------------------------------------
  // Test 8: Dynamic Custom Profile Field Creation Flow
  // -------------------------------------------------------------------------
  console.log('\n--- Test 8: Dynamic Custom Profile Field Creation & Matching ---');
  {
    // A form asks for "GitHub Profile URL"
    const formQuestion = {
      id: 'gh_question',
      label: 'Please provide your GitHub profile URL',
      type: 'text' as const
    };

    // Before custom field creation: no exact match on standard fields
    let match = matchQuestionToField(formQuestion, profile);
    assert('Question has no prior match', match.selectedFieldKey === undefined || match.confidence < 0.90);

    // User creates custom field with aliases
    const createdField = await addCustomField(profile.id, {
      name: 'GitHub Profile',
      value: 'https://github.com/rahulkumar',
      category: 'online',
      aliases: ['github profile', 'github url', 'github link']
    });

    assert('Custom field created with aliases', createdField.aliases?.includes('github profile') === true);

    // Re-evaluate matching with new custom field in profile
    const updatedProfile = await getActiveProfile();
    match = matchQuestionToField(formQuestion, updatedProfile);
    assert('Matcher recognizes newly created custom field by alias', match.selectedFieldKey === createdField.key);
    assert('Assigned value matches custom field', match.assignedValue === 'https://github.com/rahulkumar');
    assert('Match confidence is high (>= 94%)', match.confidence >= 0.94);
  }

  // -------------------------------------------------------------------------
  // Test 9: Post-Fill Verification & Failure Reporting
  // -------------------------------------------------------------------------
  console.log('\n--- Test 9: Post-Fill Verification Step ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <form>
        <label for="test_email">Email</label>
        <input id="test_email" type="email" data-formfill-id="email_field" />
      </form>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
    (global as any).Event = dom.window.Event;
    (global as any).KeyboardEvent = dom.window.KeyboardEvent;

    const validMatch: FormFieldMatchItem = {
      detectedField: { id: 'email_field', label: 'Email', type: 'email' },
      assignedValue: 'rahul@example.com',
      confidence: 0.98,
      confidenceTier: 'high',
      matchReason: 'Exact match',
      candidates: [],
      enabled: true
    };

    // Intentionally include an unfillable/missing field to test failure reporting
    const brokenMatch: FormFieldMatchItem = {
      detectedField: { id: 'non_existent_element', label: 'Missing Input', type: 'text' },
      assignedValue: 'Some Value',
      confidence: 0.95,
      confidenceTier: 'high',
      matchReason: 'Simulated failure',
      candidates: [],
      enabled: true
    };

    const verificationResult = fillAllMatchedFields([validMatch, brokenMatch]);

    assert('Post-fill verification reported total attempted = 2', verificationResult.totalAttempted === 2);
    assert('Post-fill verification reported successCount = 1', verificationResult.successCount === 1);
    assert('Post-fill verification reported failedCount = 1', verificationResult.failedCount === 1);
    assert('Failed field reason captured', verificationResult.failedFields[0].fieldId === 'non_existent_element');
  }

  // -------------------------------------------------------------------------
  // Test 10: Complete Real-World Multi-Section Form Flow (Never Auto-Submits)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 10: Complete Multi-Section Form Flow (Safe, No Auto-Submit) ---');
  {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <form id="full-form">
        <fieldset>
          <legend>Applicant Information</legend>
          <label for="first_name">First Name</label>
          <input id="first_name" type="text" name="first_name" />
          <label for="last_name">Last Name</label>
          <input id="last_name" type="text" name="last_name" />
          <label for="email">Email</label>
          <input id="email" type="email" name="email" />
        </fieldset>
        <button type="submit" id="submit-btn">Submit Application</button>
      </form>
    </body></html>`);

    (global as any).window = dom.window;
    (global as any).document = dom.window.document;
    (global as any).HTMLInputElement = dom.window.HTMLInputElement;
    (global as any).HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
    (global as any).HTMLSelectElement = dom.window.HTMLSelectElement;
    (global as any).Event = dom.window.Event;
    (global as any).KeyboardEvent = dom.window.KeyboardEvent;

    let submitFired = false;
    dom.window.document.getElementById('full-form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      submitFired = true;
    });

    const fields = detectGenericFormFields();
    const matches = matchAllDetectedFields(fields, profile);
    const result = fillAllMatchedFields(matches);

    assert('All valid fields filled and verified', result.successCount === 3 && result.failedCount === 0);
    assert('CRITICAL: Form was NEVER submitted automatically', submitFired === false);
  }

  console.log(`\n=============================================================`);
  console.log(`  Integration / E2E Test Suite Results: ${passed} passed, ${failed} failed`);
  console.log(`=============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationE2ETests();
