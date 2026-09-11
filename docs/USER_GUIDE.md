# FormFill Helper — User Guide 📘

Welcome to **FormFill Helper**! This guide walks you through setting up your personal profile, scanning and filling forms across the web, and customizing your settings.

---

## 1. Installing FormFill Helper

1. Download or clone the `FormFiller-Extension` repository onto your computer.
2. In your terminal, build the extension if not already built:
   ```bash
   npm install
   npm run build
   ```
3. Open Google Chrome (or any Chromium browser like Brave, Edge).
4. Navigate to `chrome://extensions/` in your address bar.
5. In the top right corner, switch on **Developer mode**.
6. Click the **Load unpacked** button in the top left corner.
7. Select the `dist/` folder inside the `FormFiller-Extension` directory.
8. FormFill Helper will appear in your Chrome toolbar. Pin it to your toolbar by clicking the puzzle piece icon and selecting the pin icon next to **FormFill Helper**.

---

## 2. Setting Up Your Profile

Before filling forms, you need to add your personal information:

1. Click the FormFill Helper icon in your Chrome toolbar.
2. Click **[ Open Settings ]** (or right-click the extension icon and select **Options**).
3. The Settings Dashboard will open with pre-organized categories:
   - **Personal**: First Name, Last Name, Full Name, Date of Birth, Gender.
   - **Contact**: Email Address, Phone Number, Alternate Phone.
   - **Address**: Street Address, Apartment/Suite, City, State/Province, Country, ZIP/Postal Code.
   - **Education**: School, College/University, Degree, Major, Graduation Year.
   - **Work**: Occupation, Job Title, Company, Industry, Years of Experience.
   - **Online**: LinkedIn Profile, GitHub, Portfolio Website, Personal Website.
   - **Travel / Flight**: Passport Number, Expiry Date, Nationality, Country of Issue, Known Traveler Number (TSA PreCheck), Emergency Contact details.
   - **Job Applications**: Notice Period, Current CTC, Expected Salary, Work Authorization.
4. Fill in any fields you frequently use. You do not have to fill out everything; only complete the fields you care about.
5. Edits are **automatically saved locally** as you type.

### Tip: Composite Name Derivation
If you enter your **First Name** and **Last Name**, you don't even need to type your **Full Name**! FormFill Helper will automatically combine them when a form asks for your full name.

---

## 3. Adding Custom Fields

Have unique questions that aren't in the default categories (e.g. `Student ID Number`, `Blood Group`, `Frequent Flyer Account`, or `Dietary Preference`)?

1. Open **Settings** (Options page) or click **[ + Create Profile Field ]** inside any Form Preview.
2. Scroll to the **Custom Fields** section and click **[ + Add Custom Field ]**.
3. Enter:
   - **Field Label**: What you want to call it (e.g. `Frequent Flyer Number`).
   - **Saved Value**: Your data (e.g. `AA1234567`).
   - **Category**: Group it under Travel, Work, Personal, etc.
   - **Question Aliases**: Comma-separated alternative names websites might use (e.g. `loyalty number, airline rewards, frequent flyer #`).
   - **Sensitive Field**: Check this box if the information is confidential and should require explicit opt-in every time.
4. Click **[ Save Custom Field ]**. It is now immediately available for matching.

---

## 4. Scanning a Form on Any Website

1. Navigate to the webpage with the form you want to fill (e.g. a Google Form, a Workday job application, a Greenhouse job portal, or a travel booking site).
2. Click the **FormFill Helper** extension icon in your toolbar.
3. The popup automatically detects the page type:
   - 📋 **Google Form**
   - 💼 **Job Application**
   - ✈️ **Flight / Travel Booking**
   - 🌐 **Web Form**
4. The popup displays the number of detected questions.
5. Click **[ Preview & Fill ]** to open the interactive review modal.

---

## 5. Reviewing and Customizing Matches

FormFill Helper will never blindly fill a form. The **Form Preview Modal** presents a clear, line-by-line review of every detected field:

- **Form Question**: The question text or label found on the page.
- **Matched Profile Field**: Which field from your profile was selected.
- **Proposed Value**: The value that will be inserted. You can edit this value directly in the box for this specific form without changing your saved profile!
- **Confidence Badge**:
  - 🟢 **High Confidence (95%–100%)**: Unambiguous exact alias or autocomplete match. Auto-checked for filling.
  - 🟡 **Review Suggested (85%–94%)**: Context-boosted keyword match. Auto-checked, but marked for your review.
  - 🟠 **Manual Confirmation (70%–84%)**: Partial or ambiguous match. **Unchecked by default**. You must check the box to fill it.
  - ⚪ **No Match (< 70%)**: Left empty.
- **🛡️ Sensitive Field Warning**:
  - Fields like Passport Number, Passport Expiry, and Emergency Contact details display an amber shield badge.
  - **They are unchecked by default**. You must explicitly check their checkbox to fill them.
- **Existing Content Protection**:
  - If a form field already contains text that you previously typed, FormFill Helper unchecks it to prevent accidental overwriting.

---

## 6. Remapping and Remembering Mappings

If the matcher chose the wrong profile field or if you want to assign a question to something else:

1. Click the dropdown menu next to the field in the Preview Modal.
2. Select any other field from your profile (or choose `-- Do Not Fill --`).
3. If you want FormFill Helper to remember this decision for future forms with the same question, check **"Remember this mapping"**.
4. The extension will save your choice and automatically use it on subsequent visits with 98% confidence.

---

## 7. Filling the Form

1. Once you are satisfied with the checked items and values, click **[ Fill Fields ]** at the bottom of the modal.
2. FormFill Helper simulates native keyboard and mouse events so React, Angular, Vue, and Google Forms update their internal form state.
3. A **Post-Fill Verification Banner** appears at the top of the modal, reporting:
   - Total fields attempted
   - Successfully verified fields
   - Any fields that could not be set (e.g. read-only elements or custom dropdowns requiring manual selection).
4. **Safety Rule**: FormFill Helper **NEVER clicks "Submit"**. You retain 100% control to review the completed form and click submit yourself.

---

## 8. What Happens When a Field Cannot Be Matched?

If a question has no match:
1. It appears in the preview with `-- No Match --` and a grey badge.
2. You can manually select a profile field from the dropdown.
3. Or, click **[ + Create Profile Field ]** directly inside the modal to create a new profile field on the fly. The question text will automatically be added as an alias!

---

## 9. Troubleshooting

### The extension says "No supported form fields detected"
- Make sure the form is not inside a cross-origin iframe (e.g., some payment gateways render inside restricted third-party iframes).
- If the form is multi-step (e.g., Step 2 after clicking Next), close the popup and reopen it to rescan the new page elements.

### A field was filled in the DOM but the website says it is empty
- Some complex SPA frameworks require a keystroke or blur event. FormFill Helper dispatches synthetic `input`, `change`, and `blur` events. If a specific custom widget does not update, click into the input and press space or backspace.

### Sensitive fields aren't being filled
- This is intentional. Passport numbers, expiry dates, and emergency contacts are flagged as sensitive. You must check their box in the Preview Modal before clicking **[ Fill Fields ]**.
