# FormFill Helper 📝

> A privacy-first, generic form-filling assistant Chrome extension built with Manifest V3, React 19, and TypeScript. Fill repetitive job applications, flight bookings, Google Forms, and web forms effortlessly without compromising your personal data.

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tests](https://img.shields.io/badge/Tests-124%20Passing-brightgreen.svg)](test/)

---

## Table of Contents

- [The Problem It Solves](#the-problem-it-solves)
- [What FormFill Helper Does](#what-formfill-helper-does)
- [Key Features](#key-features)
- [Screenshots & Demo](#screenshots--demo)
- [How It Works Under the Hood](#how-it-works-under-the-hood)
- [Supported Form Fields & Semantic Variations](#supported-form-fields--semantic-variations)
- [Installation (Local Developer Mode)](#installation-local-developer-mode)
- [Step-by-Step Usage Guide](#step-by-step-usage-guide)
- [Robustness & Edge Cases Handled](#robustness--edge-cases-handled)
- [Strict Safety & Privacy Guarantees](#strict-safety--privacy-guarantees)
- [Known Limitations](#known-limitations)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## The Problem It Solves

Filling out online forms is tedious and repetitive:
- **Job applicants** retype the exact same employment history, education, LinkedIn URL, notice period, and contact details across dozens of applicant tracking systems (Workday, Greenhouse, Lever).
- **Travelers** manually enter passport numbers, expiry dates, TSA PreCheck IDs, and emergency contacts across different airline booking engines.
- **Students & Freelancers** repeatedly fill registration forms, event surveys, and client questionnaires on Google Forms.
- Existing browser autofill tools are rigid: they only recognize basic address fields, fail on modern Single Page Applications (React/Vue/Angular), cannot handle custom questions, and often fill forms blindly without giving users a chance to preview or adjust values.

**FormFill Helper** solves this by providing a unified, local assistant that detects questions contextually, derives values semantically, presents a clear preview before filling, and simulates native user events so modern web frameworks register the inputs.

---

## What FormFill Helper Does

1. **Enter Your Information Once**: Save your personal, contact, address, education, employment, travel, and job application preferences in an organized local dashboard.
2. **Contextual Page Detection**: Automatically detects whether you are on a Google Form, a Workday/Greenhouse job application, an airline checkout, or a standard web form.
3. **Semantic Question Matching**: Analyzes input labels, placeholders, surrounding section context, and HTML5 autocomplete attributes using an extensive synonym and abbreviation dictionary.
4. **Composite Field Derivation**: Automatically synthesizes combined fields (e.g. derives `Full Name` from `First Name` + `Last Name`, or extracts first/last names from a full name).
5. **Interactive Preview & Remapping**: Displays every matched question in a clean modal with confidence badges, letting you review, customize values, or reassign mappings before filling.
6. **Simulated Event Injection**: Dispatches native prototype setters (`focus`, `input`, `change`, `blur`) so reactive frameworks (React 16+, Vue, Angular) properly update their internal state.
7. **Post-Fill Verification**: Validates whether the values were successfully written into the DOM and framework state, reporting any unfillable elements.

---

## Key Features

- 🛡️ **100% Local & Privacy-First**: Zero external servers, zero cloud databases, zero telemetry, and zero network calls. All profile data stays inside your browser's local `chrome.storage.local`.
- 🔍 **Universal Form Scanner**: Works on Google Forms, Workday, Greenhouse, Lever, airline checkout funnels, and standard HTML5 forms.
- 🎛️ **Behavior-Driven Confidence Tiers**:
  - **High (95%–100%)**: Exact alias or autocomplete match, auto-enabled for filling.
  - **Review (85%–94%)**: Context-boosted keyword match, marked with a review recommendation badge.
  - **Manual (70%–84%)**: Partial or ambiguous match, **unchecked by default** requiring user confirmation.
  - **None (< 70%)**: Low confidence or essay questions, left untouched.
- 🔒 **Sensitive Field Opt-In**: Passport numbers, expiry dates, and emergency contacts are flagged with an amber shield badge and are **never filled without explicit user opt-in**.
- 🚫 **Strict Credential Exclusion**: Passwords, OTP codes, CVV/CVC codes, banking PINs, API keys, and security question answers are hardcoded to be completely ignored.
- 💾 **Non-Empty Input Protection**: Form fields that already contain user-typed text are left unchecked by default to prevent accidental overwriting.
- 🧩 **Dynamic Custom Profile Fields**: Create custom fields with custom aliases on the fly directly from the preview modal or settings dashboard.
- 🧠 **Learned Question Mappings**: Remembers your manual question reassignments so future forms with identical wording auto-match your preferred choice.
- 🚫 **Never Automatically Submits Forms**: FormFill Helper strictly stops after filling inputs. You always retain final manual control to review and submit.

---

## Screenshots & Demo

> *Note: Below are placeholders for screenshots and demo media. Replace them with your recordings or screenshots.*

### 1. Interactive Form Preview Modal
Review matched questions, confidence scores, sensitive field warnings, and custom value adjustments before filling.

![Form Preview Modal](docs/images/screenshot-preview.png)
*(Placeholder: Add your screenshot of the Preview Modal here at `docs/images/screenshot-preview.png`)*

### 2. Extension Popup & Scanner
Live status display showing active domain type (Google Form, Job Application, Flight Booking) and detected input count.

![Extension Popup](docs/images/screenshot-popup.png)
*(Placeholder: Add your screenshot of the Popup here at `docs/images/screenshot-popup.png`)*

### 3. Profile & Custom Field Settings
Comprehensive dashboard for managing Personal, Contact, Address, Education, Work, Travel, and Custom fields.

![Settings Dashboard](docs/images/screenshot-options.png)
*(Placeholder: Add your screenshot of the Options Dashboard here at `docs/images/screenshot-options.png`)*

### 4. End-to-End Demo GIF / Video
Watch FormFill Helper scan, preview, and fill a multi-field application form in seconds.

<!-- Placeholder for demo animation or video link -->
```text
[ Demo GIF Placeholder: docs/images/demo.gif ]
```

---

## How It Works Under the Hood

FormFill Helper does **not** rely on slow or privacy-invasive external AI/LLM cloud services. Instead, it uses a deterministic, rule-based semantic pipeline engineered for speed, privacy, and precision:

```
[ Webpage DOM Form Elements ]
             │
             ▼
[ 1. Element Detection & Security Filter ]
     ├── Excludes hidden, disabled, readonly elements
     └── Strictly excludes passwords, OTP, CVV, PINs, API keys
             │
             ▼
[ 2. Text Normalization & Abbreviation Expansion ]
     ├── Expands '#' -> 'number', 'No.' -> 'number', 'Mob.' -> 'mobile', 'Tel.' -> 'telephone'
     └── Cleans parenthetical instructions: '(with country code)', '(optional)', '(in days)'
             │
             ▼
[ 3. Multi-Tier Semantic Question Matcher ]
     ├── Tier 1: HTML5 Autocomplete attribute (100% certainty)
     ├── Tier 2: User-Learned Remembered Mappings (98% confidence)
     ├── Tier 3: Custom Field Aliases (94%–95% confidence)
     └── Tier 4: Predefined Alias Dictionary & Negative-Keyword Filters (80%–96%)
             │
             ▼
[ 4. Composite & Derived Value Resolution ]
     ├── First Name + Last Name -> Full Name
     ├── Full Name -> First Name / Last Name
     └── Address Components -> Full Address / Location
             │
             ▼
[ 5. Interactive Form Preview Modal (User Review & Opt-In) ]
             │
             ▼
[ 6. Simulated Event Injection (Native Setter + input/change/blur) ]
             │
             ▼
[ 7. Post-Fill Verification & Accuracy Reporting ]
```

---

## Supported Form Fields & Semantic Variations

FormFill Helper comes pre-configured with support for common form questions across all industries:

| Category | Profile Field | Example Form Questions Recognized |
| :--- | :--- | :--- |
| **Personal** | Full Name | Full Name, Complete Name, Legal Name, Your Full Name, Name |
| | First Name | First Name, Given Name, Forename, Fname, 1st Name |
| | Last Name | Last Name, Family Name, Surname, Lname, Family / Last Name |
| | Date of Birth | Date of Birth, Birth Date, DOB, Birthdate |
| | Gender | Gender, Sex, Select Gender |
| **Contact** | Email Address | Email, Email Address, E-mail, Contact Email, Work Email, Email ID |
| | Phone Number | Phone, Phone Number, Mobile, Mobile Number, Contact Number, Contact No., Telephone, Cell Phone, Primary Phone |
| | Alternate Phone | Alternate Phone, Secondary Phone, Alt Phone, Backup Phone |
| **Address** | Street Address | Street Address, Address Line 1, Residential Address, Mailing Address |
| | Apt / Suite | Address Line 2, Apt, Suite, Unit, Apartment |
| | City | City, Town, Municipality, City of Residence |
| | State / Province | State, Province, Region, State / Province |
| | ZIP / Postal Code | ZIP, ZIP Code, Postal Code, Postcode, PIN Code |
| | Country | Country, Nation, Country of Residence, Citizenship Country |
| **Education** | College / University | College, University, Institution, Name of Institution, Alma Mater |
| | Degree | Degree, Highest Degree, Qualification, Level of Education |
| | Field of Study | Field of Study, Major, Discipline, Branch of Study, Stream |
| | Graduation Year | Graduation Year, Year of Graduation, Year of Completion, Passing Year |
| **Work** | Company | Current Company, Employer, Current Employer, Workplace, Company Name |
| | Job Title | Job Title, Designation, Current Role, Current Position, Professional Title |
| | Total Experience | Years of Experience, Total Experience, Relevant Experience, Work Experience |
| **Travel** | Passport Number 🛡️ | Passport Number, Passport No., Passport #, Travel Document Number |
| | Passport Expiry 🛡️ | Passport Expiry, Passport Expiration Date, Document Expiration |
| | Issuing Country | Passport Issuing Country, Country of Issue, Issuing Authority |
| | TSA PreCheck | Known Traveler Number, KTN, TSA PreCheck, Redress Number |
| | Emergency Contact 🛡️ | Emergency Contact Person, Emergency Contact Name, Emergency Phone |
| **Job Search**| Expected Salary | Expected CTC, Expected Salary, Salary Expectation, Desired Compensation |
| | Notice Period | Notice Period, Availability, How soon can you start, Joining Notice |
| | Work Authorization | Work Authorization, Are you authorized to work, Visa Status, Sponsorship |
| **Custom** | Custom Fields | Any user-defined fields (e.g. Student ID, Frequent Flyer #, Dietary Preference) |

*(🛡️ indicates fields flagged as Sensitive requiring explicit user opt-in).*

---

## Installation (Local Developer Mode)

### Prerequisites
- Node.js (v18.0.0 or higher)
- Google Chrome, Brave, Microsoft Edge, or any Chromium-based browser

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/formfill-helper.git
cd formfill-helper
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
```bash
npm run build
```
This runs TypeScript checking (`tsc`) and compiles production assets into the `dist/` folder via Vite.

### 4. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Turn on the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist/` directory located inside the project folder (`formfill-helper/dist`).
5. FormFill Helper is now installed! Pin it to your Chrome toolbar.

---

## Step-by-Step Usage Guide

### 1. Set Up Your Information
- Click the FormFill Helper extension icon in your Chrome toolbar.
- Click **[ Open Settings ]** (or right-click the icon and choose **Options**).
- Fill in your commonly used personal, contact, address, education, work, and travel details.
- Everything is **automatically saved locally as you type**.

### 2. Navigate to Any Web Form
- Open a Google Form, Workday job application, Greenhouse portal, airline checkout, or general web form.

### 3. Scan the Page
- Click the FormFill Helper toolbar icon.
- The popup displays the detected page type and the number of questions found on the page.
- Click **[ Preview & Fill ]**.

### 4. Review & Confirm
- The **Form Preview Modal** opens over the page:
  - Verify matched fields and proposed values.
  - Edit values directly in the preview if needed for that specific form.
  - Review any **🛡️ Sensitive Field** warnings (check their boxes if you wish to fill them).
  - Remap any misassigned fields using the dropdown and optionally check **"Remember this mapping"**.
- Click **[ Fill Fields ]**.

### 5. Final Manual Review & Submit
- FormFill Helper fills the fields and reports the verification result.
- Perform a final visual review of the form, complete any CAPTCHA if present, and click the form's **Submit** button yourself.

---

## Robustness & Edge Cases Handled

- **SPA Controlled Inputs (React, Vue, Angular)**: Standard property assignment (`input.value = 'x'`) fails in modern frameworks because React overrides setter descriptors. FormFill Helper uses `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set` and dispatches `focus`, `input`, `change`, `keyup`, and `blur` events so framework state updates reactively.
- **Custom ARIA Comboboxes & Dropdowns**: Detects `role="combobox"`, `role="listbox"`, and `role="option"`, triggers typeahead keyboard queries, and clicks matching custom options without requiring native `<select>` tags.
- **Abbreviation & Punctuation Expansion**: Normalizes abbreviations (`No.`, `Num.`, `Mob.`, `Tel.`, `Yrs.`, `#`) before matching.
- **Essay Question Protection**: Strict negative keyword filters prevent open-ended written questions (`"Why do you want to join our company?"`, `"Tell us about a time you resolved conflict"`) from being overwritten.
- **Non-Empty Input Preservation**: Inputs that already contain text in the DOM are detected and unchecked by default, preventing accidental data loss.
- **Google Forms Custom Layouts**: Deep DOM traversal inspects Google Forms custom list items, radio button circles (`div[role="radio"]`), and floating label text containers.
- **Hidden, Disabled & Readonly Element Exclusion**: Elements styled with `display: none`, `visibility: hidden`, `disabled`, or `readonly` are filtered out.

---

## Strict Safety & Privacy Guarantees

1. **Zero External Communication**: The extension contains no network fetching code for analytics or profile synchronization.
2. **Never Automatically Submits**: The extension will never trigger `form.submit()`, click submit buttons, or bypass your final review.
3. **Never Touches Credentials**: Passwords, OTP codes, banking PINs, credit card CVVs, and API keys are strictly excluded.
4. **Explicit Sensitive Opt-In**: Sensitive travel and emergency contact data requires deliberate, manual checkbox opt-in.
5. **Isolated Storage Sandbox**: All profile data is contained inside Chrome's local extension storage partition.

For complete privacy details, see [docs/PRIVACY.md](docs/PRIVACY.md).

---

## Known Limitations

- **Cross-Origin iframes**: Inputs embedded inside cross-origin `<iframe>` elements cannot be accessed due to browser Same-Origin Policy (SOP).
- **CAPTCHAs & Bot Detectors**: FormFill Helper does not and will not solve or bypass anti-bot mechanisms (Cloudflare Turnstile, reCAPTCHA, hCaptcha).
- **Closed Shadow DOM**: Elements inside `#shadow-root (closed)` cannot be inspected via standard DOM queries. (Open shadow roots are supported).
- **Canvas Controls**: Non-DOM controls drawn directly on an HTML5 `<canvas>` cannot be detected or filled.

---

## Tech Stack

- **Extension Framework**: Chrome Extension Manifest V3
- **Frontend UI**: React 19, Lucide React icons
- **Language**: TypeScript 5.7 (strict type safety)
- **Bundler**: Vite 6 (multi-page rollup)
- **Storage**: `chrome.storage.local`
- **Testing**: `tsx`, `jsdom`, Node.js automated test runner (124 tests passing)

---

## Project Structure

```text
FormFiller-Extension/
├── public/
│   ├── manifest.json              # Manifest V3 extension configuration
│   └── icons/                     # Extension icons (16, 48, 128)
├── src/
│   ├── background/
│   │   └── background.ts          # Extension service worker lifecycle
│   ├── content/
│   │   ├── contentScript.ts       # Content script message coordinator
│   │   ├── formExtractor.ts       # Scanner coordinator (Google Forms + Generic)
│   │   ├── genericFormDetector.ts # DOM inspector for web forms & comboboxes
│   │   ├── googleFormsDetector.ts # Google Forms specialized parser
│   │   └── formFiller.ts          # Event simulation & post-fill verification
│   ├── matching/
│   │   ├── aliases.ts             # Dictionary of field aliases and negative keywords
│   │   ├── normalization.ts       # Normalization pipeline & abbreviation expansion
│   │   ├── compositeResolver.ts   # Derives composite values (Full Name, Address, Location)
│   │   ├── learnedMappings.ts     # User-learned mapping storage CRUD
│   │   └── questionMatcher.ts     # Multi-tier confidence scoring engine
│   ├── profile/
│   │   ├── defaultFields.ts       # Predefined schema blueprints & categories
│   │   └── profileStore.ts        # Storage manager with reactive listeners
│   ├── popup/
│   │   ├── App.tsx                # Popup UI with live scanner
│   │   ├── components/
│   │   │   └── FormPreviewModal.tsx # Interactive Form Preview & Fill modal
│   │   └── popup.css              # Popup styling
│   ├── options/
│   │   ├── App.tsx                # Options dashboard for profile management
│   │   └── options.css            # Options styling
│   └── shared/
│       └── types.ts               # Shared TypeScript interfaces & types
├── docs/
│   ├── USER_GUIDE.md              # Detailed end-user guide
│   ├── PRIVACY.md                 # Complete privacy & security policy
│   ├── TESTING.md                 # Test suite documentation & test methodology
│   └── images/                    # Screenshot and demo media directory
├── test/
│   ├── questionMatcher.test.ts    # Unit test suite (84 test cases)
│   ├── integrationE2E.test.ts     # Integration & E2E test suite (40 test assertions)
│   ├── mock-job-application.html  # Mock job application test form
│   ├── mock-flight-booking.html   # Mock airline passenger test form
│   └── mock-google-form.html      # Mock Google Forms DOM structure
├── LICENSE                        # MIT License
├── package.json                   # Project metadata & test scripts
├── tsconfig.json                  # TypeScript compiler settings
└── vite.config.ts                 # Vite multi-entry build configuration
```

---

## Future Improvements

- [ ] Support for multi-page step navigation with automatic rescan prompts.
- [ ] Export and import encrypted profile backup files (JSON with password encryption).
- [ ] Profile switching shortcuts via keyboard commands.
- [ ] Extended international format presets for phone numbers and postal codes.
- [ ] Firefox Add-on (Manifest V3) cross-browser compatibility.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
