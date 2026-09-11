# FormFill Helper — Privacy & Security Policy 🔒

Privacy is not an afterthought in FormFill Helper; it is the fundamental architectural constraint of the product. This document outlines exactly how your data is handled, stored, and protected.

---

## 1. Zero Cloud Transmission: 100% On-Device

- **Your data never leaves your computer**.
- FormFill Helper does **NOT** operate any backend servers, cloud databases, analytics endpoints, or remote telemetry services.
- There are **zero outbound network calls** made by the extension background worker, popup, options dashboard, or content scripts.
- The extension does not use Google Analytics, PostHog, Mixpanel, Sentry, or any third-party tracking scripts.

---

## 2. Where Profile Data Is Stored

All your saved information (including predefined profile fields, custom fields, and remembered question mappings) is stored exclusively in **`chrome.storage.local`** within your local browser profile directory on your device:

- On Windows: `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Extension Settings\<extension-id>`
- On macOS: `~/Library/Application Support/Google/Chrome/Default/Local Extension Settings/<extension-id>`
- On Linux: `~/.config/google-chrome/Default/Local Extension Settings/<extension-id>`

This storage sandbox is managed by Chrome and is isolated so other extensions and visited websites cannot inspect or read your FormFill Helper profile data.

---

## 3. What Information Is Stored

The extension stores only what you explicitly type into the Profile Management dashboard:
1. **Personal Information**: Names, Date of Birth, Gender.
2. **Contact Details**: Email address, Phone number.
3. **Address**: Street, City, State, Country, Postal code.
4. **Professional & Education**: Employer, Job title, University, Degree, Experience.
5. **Travel Details**: Passport number, Passport expiry, Nationality, TSA PreCheck, Emergency contacts.
6. **Job Preferences**: Notice period, Expected compensation, Work authorization status.
7. **Custom Fields**: Any arbitrary fields you explicitly create.
8. **Learned Question Mappings**: Normalized form questions you chose to "Remember" and the profile key they mapped to.

---

## 4. Sensitive Field Safeguards

Certain fields contain high-sensitivity personal information:
- Passport Number
- Passport Expiry Date
- Passport Issuing Country
- National / Government ID (SSN, Aadhaar, Driver's License)
- Emergency Contact Name & Phone

**Strict Rule**: These fields are flagged with `isSensitive: true`. Even when a form question matches with 100% confidence, sensitive fields are **always unchecked by default** in the Form Preview Modal. They will never be filled unless you explicitly check their opt-in box.

---

## 5. Strict Credential & Financial Exclusion

FormFill Helper contains hardcoded security safeguards that prevent the detection or autofilling of credentials and financial secrets:

- **Passwords & Confirm Passwords**: Never scanned, matched, or filled.
- **One-Time Passwords (OTP) & Verification Codes**: Strictly excluded.
- **Card Verification Values (CVV / CVC) & Credit Card Numbers**: Strictly excluded.
- **Banking PINs & ATM Codes**: Strictly excluded.
- **API Keys, Secret Keys, Private Keys, & Bearer Tokens**: Strictly excluded.
- **Security Question Answers** (e.g. "Mother's maiden name"): Strictly excluded.

---

## 6. Permissions Required & Why

The extension requests the following permissions in `manifest.json`:

| Permission | Purpose |
| :--- | :--- |
| `storage` | To save your profile information and learned mappings locally on your machine via `chrome.storage.local`. |
| `activeTab` | To interact with the tab you currently have open when you click the extension icon. |
| `scripting` | To inject the content script into the active page when you request a form scan. |
| `<all_urls>` | Required so you can use the form assistant across any web form you choose to visit (Google Forms, Workday, job boards, airline sites, etc.). |

---

## 7. What the Extension Does NOT Do

- **Does NOT automatically submit forms**: The extension only simulates filling inputs. It will never click the "Submit", "Apply", or "Pay" button.
- **Does NOT track your browsing history**: The extension only inspects the DOM when you explicitly open the popup and click "Preview & Fill".
- **Does NOT read or store payment card details**.
- **Does NOT sell, monetize, or share your data**: There are no ads, trackers, or monetization partnerships.

---

## 8. Data Deletion & Reset

You have complete control over your data:
- **Reset or Clear Data**: Open **Settings** and delete individual field values or remove custom fields at any time.
- **Complete Eradication**: Removing the extension from Chrome (`chrome://extensions/` → **Remove**) immediately and irreversibly deletes the local storage sandbox containing all profile data and learned mappings.
