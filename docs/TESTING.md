# FormFill Helper — Testing & Quality Assurance 🧪

This document provides a comprehensive overview of the automated test suites, manual verification methods, supported frameworks, edge cases handled, and known real-world limitations of FormFill Helper.

---

## 1. Automated Test Suites

FormFill Helper includes two automated test suites executed in a headless Node.js / JSDOM environment via `npm test`:

```bash
npm test
```

### Test Suite 1: Matching Engine Unit Tests (`test/questionMatcher.test.ts`)
Validates question parsing, normalization, abbreviation expansion, semantic equivalence, composite field derivation, and security exclusions (84 test cases):

1. **Email Variations (6 tests)**: `Email`, `Email address`, `E-mail address`, `Your email`, `Contact email`, `Work email`.
2. **Phone Variations (5 tests)**: `Mobile number`, `Phone number`, `Contact number`, `Telephone number`, `Cell phone`.
3. **Name & Education Variations (7 tests)**: `Full Name`, `Your full name`, `First Name`, `Last Name`, `College`, `University`, `Name of institution`.
4. **Flight & Travel Details (7 tests)**: `Passenger First Name`, `Passport Number`, `Passport No.`, `Country of Issue`, `TSA PreCheck`, `Emergency Contact Person`, `Emergency Phone`.
5. **Job Search Questions (5 tests)**: `Notice Period`, `Expected Salary`, `Are you authorized to work in the US?`, `LinkedIn profile url`, `Years of relevant experience`.
6. **HTML5 Autocomplete Attributes (4 tests)**: `given-name`, `family-name`, `email`, `tel`.
7. **Essay / Open-Ended Questions (3 tests)**: Protects candidate written answers (`"Why do you want to join our company?"`, `"Describe your favorite weekend hobby"`).
8. **Phone & Contact Disambiguation Regressions (16 tests)**:
   - Verifies `"Contact Number"`, `"Contact No."`, `"CONTACT-NUMBER"`, `"Mobile No"`, `"Telephone Number"`, `"Primary Contact Number"`, `"Cell Number"`, and `"Contact Phone"` all achieve >= 95% confidence for `phone`.
   - Verifies `"Contact"` alone achieves 0% confidence and is **never** auto-mapped to phone.
   - Verifies `"Emergency Contact"` and `"Emergency Contact Phone"` route strictly to emergency fields with sensitive flags.
9. **Expanded Semantic Equivalencies Across Categories (18 tests)**:
   - Personal: `Given Name`, `Surname`, `Legal Name`.
   - Address: `Postal Code`, `PIN Code`, `Province`, `Current City`.
   - Education: `Alma Mater`, `Qualification`, `Year of Graduation`.
   - Professional: `Current Employer`, `Designation`, `Total Work Experience`.
   - Travel: `Passport Issuing Country`, `Travel Document Number`.
   - Job Search: `Expected Compensation`, `Joining Notice`, `Availability to Join`.
10. **Composite & Derived Profile Field Values (5 tests)**:
    - Synthesizes `Full Name` from `firstName = 'Tanvi'` + `lastName = 'Chhaparia'` when `fullName` is empty.
    - Reverse-derives `firstName` and `lastName` from `fullName = 'Alex Mercer'` when granular names are empty.
    - Synthesizes composite location from `city`, `state`, `country`.
11. **Strict Security & Credential Exclusions (7 tests)**:
    - Rejects `Password`, `Confirm Password`, `Enter OTP Code`, `CVV / CVC`, `Banking PIN`, `Your API Key`, and `Security Question Answer`.
12. **Preservation of Non-Empty Existing Values (1 test)**:
    - Guarantees fields already containing text in the DOM are flagged `enabled: false` by default.

### Test Suite 2: E2E & Integration Tests (`test/integrationE2E.test.ts`)
Simulates complete browser DOM lifecycles from detection to filling and verification (40 test assertions):

- **Test 1: React Controlled Input State**: Uses `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set` to verify that React 16+ internal state registers value changes.
- **Test 2: Modern ARIA Comboboxes**: Detects `role="combobox"` and `role="option"`, triggers typeahead keyboard events, and clicks listbox options.
- **Test 3: Sensitive Field Opt-In**: Ensures sensitive fields are unfilled without explicit opt-in and fill properly after user opt-in.
- **Test 4: Behavior-Driven Confidence Tiers**: Verifies High (>=95%), Review (85–94%), Manual (70–84%), and None (<70%) tier assignments.
- **Test 5: Exclusion of Hidden / Disabled Fields**: Verifies `display: none`, `visibility: hidden`, `disabled`, and `readonly` inputs are strictly skipped.
- **Test 6: Custom ARIA Radio & Checkbox Controls**: Validates `role="radio"` and `role="checkbox"` state changes.
- **Test 7: Dynamic Multi-Step AJAX Fields**: Rescans DOM after dynamic additions and verifies step-2 fields.
- **Test 8: Dynamic Custom Profile Field Creation**: Tests on-the-fly custom field addition with custom aliases and real-time re-matching.
- **Test 9: Post-Fill Verification**: Validates failure detection when a DOM element rejects an assigned value.
- **Test 10: Complete Multi-Section Form Flow**: Fills multi-section forms and proves the form is **never** automatically submitted.

---

## 2. Manual Testing Performed

FormFill Helper was manually tested across real-world and local mock environments:

1. **Google Forms (`docs.google.com/forms`)**:
   - Tested floating labels, custom radio groups (`div[role="radio"]`), and multi-option checkboxes.
2. **Workday (`myworkdayjobs.com`)**:
   - Verified candidate personal information, experience fields, and notice periods.
3. **Mock Application Forms**:
   - `test/mock-job-application.html`: Greenhouse/Lever-style application with resume and LinkedIn fields.
   - `test/mock-flight-booking.html`: Airline passenger details, passport expiration, and emergency contact.
   - `test/mock-google-form.html`: Standalone Google Forms DOM structure.

---

## 3. Supported Frameworks & Custom Widgets

- **Standard HTML5**: `<input>`, `<textarea>`, `<select>`, `<input type="radio">`, `<input type="checkbox">`.
- **React (v16–v19)**: Native setter dispatching triggers React's internal `onChange` synthetic event handlers.
- **Angular (v2+)**: Dispatches native `input` and `change` events consumed by `ngModel` and `FormControl`.
- **Vue (v2 & v3)**: Dispatches `input` and `change` events registered by `v-model`.
- **Accessible ARIA Comboboxes**: Controls using `role="combobox"`, `role="listbox"`, and `role="option"` (e.g. Radix UI, Headless UI, Material-UI).

---

## 4. Important Edge Cases Handled

- **Composite Name Discrepancies**: Automatically derives `Full Name` from first and last names when only granular fields were filled in the profile.
- **Hyphenated and Abbreviated Labels**: Canonicalizes `Contact No.`, `Mobile No`, `CONTACT-NUMBER`, `Tel No.`, and `#`.
- **Parenthetical Instructions**: Cleans `(with country code)`, `(optional)`, `(in days)`, `(as shown on passport)` from labels before matching.
- **Ambiguous Single Words**: Intentionally prevents `"Contact"` alone from hijacking phone numbers or names.
- **Existing User Input**: Inputs already containing values are left unchecked by default to prevent overwriting.
- **Negative Keyword Disqualification**: Prevents open-ended questions like `"Why do you want to join our company?"` from matching company name fields.

---

## 5. Known Limitations

1. **Cross-Origin iframes**:
   Fields loaded inside an `<iframe>` hosted on a different origin cannot be accessed due to browser Same-Origin Policy (SOP).
2. **Anti-Bot & CAPTCHA Protections**:
   The extension does not and should not interact with CAPTCHA widgets (Cloudflare Turnstile, reCAPTCHA, hCaptcha).
3. **Closed Shadow DOM**:
   Elements encapsulated inside `#shadow-root (closed)` cannot be queried using standard DOM APIs. (Open shadow roots can be traversed).
4. **HTML5 Canvas / WebGL Inputs**:
   Virtual inputs drawn directly onto a canvas without corresponding DOM input elements cannot be detected.

---

## 6. Running Builds and Tests

```bash
# Run all automated tests (Unit + E2E)
npm test

# Run unit tests only
npm run test:unit

# Run E2E integration tests only
npm run test:e2e

# Compile TypeScript and build production bundle
npm run build
```
