import { matchQuestionToField } from '../src/matching/questionMatcher';
import { getDefaultStorageState } from '../src/profile/defaultFields';
import { DetectedFormField } from '../src/shared/types';

function runTests() {
  const state = getDefaultStorageState();
  const profile = state.profiles['profile_personal'];

  // Populate some sample values for testing
  profile.fields['firstName'].value = 'Rahul';
  profile.fields['lastName'].value = 'Kumar';
  profile.fields['fullName'].value = 'Rahul Kumar';
  profile.fields['email'].value = 'rahul@example.com';
  profile.fields['phone'].value = '+1 555-0199';
  profile.fields['college'].value = 'Stanford University';
  profile.fields['passportNumber'].value = 'A98765432';
  profile.fields['passportCountry'].value = 'United States';
  profile.fields['knownTravelerNumber'].value = '987654321';
  profile.fields['emergencyContactName'].value = 'Priya Kumar';
  profile.fields['emergencyContactPhone'].value = '+1 555-0177';
  profile.fields['noticePeriod'].value = '30 Days';
  profile.fields['expectedCtc'].value = '$140,000';
  profile.fields['workAuthorization'].value = 'Citizen';
  profile.fields['linkedin'].value = 'https://linkedin.com/in/rahulkumar';
  profile.fields['yearsOfExperience'].value = '5';

  let passed = 0;
  let failed = 0;

  function assertMatch(
    testLabel: string,
    field: Partial<DetectedFormField>,
    expectedKey: string | undefined,
    minConfidence: number = 0.70
  ) {
    const detected: DetectedFormField = {
      id: 'test_' + Math.random(),
      label: field.label || '',
      name: field.name,
      placeholder: field.placeholder,
      autocomplete: field.autocomplete,
      context: field.context,
      type: field.type || 'text'
    };

    const result = matchQuestionToField(detected, profile);

    const actualKey = result.selectedFieldKey;
    const matchSuccess =
      expectedKey === undefined
        ? actualKey === undefined
        : actualKey === expectedKey && result.confidence >= minConfidence;

    if (matchSuccess) {
      console.log(`  ✓ PASS: "${detected.label || detected.name || detected.autocomplete}" -> ${actualKey || 'NONE'} (${Math.round(result.confidence * 100)}%)`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: "${detected.label || detected.name || detected.autocomplete}" -> Expected: ${expectedKey || 'NONE'}, Got: ${actualKey || 'NONE'} (Conf: ${result.confidence})`);
      failed++;
    }
  }

  console.log('\n--- 1. Testing Email Question Variations ---');
  assertMatch('Email', { label: 'Email' }, 'email');
  assertMatch('Email address', { label: 'Email address' }, 'email');
  assertMatch('E-mail address', { label: 'E-mail address' }, 'email');
  assertMatch('Your email', { label: 'Your email' }, 'email');
  assertMatch('Contact email', { label: 'Contact email' }, 'email');
  assertMatch('Work email', { label: 'Work email' }, 'email');

  console.log('\n--- 2. Testing Phone Question Variations ---');
  assertMatch('Mobile number', { label: 'Mobile number' }, 'phone');
  assertMatch('Phone number', { label: 'Phone number' }, 'phone');
  assertMatch('Contact number', { label: 'Contact number' }, 'phone');
  assertMatch('Telephone number', { label: 'Telephone number' }, 'phone');
  assertMatch('Cell phone', { label: 'Cell phone' }, 'phone');

  console.log('\n--- 3. Testing Name & Education Question Variations ---');
  assertMatch('Full Name', { label: 'Full Name' }, 'fullName');
  assertMatch('Your full name', { label: 'Your full name' }, 'fullName');
  assertMatch('First Name', { label: 'First Name' }, 'firstName');
  assertMatch('Last Name', { label: 'Last Name' }, 'lastName');
  assertMatch('College', { label: 'College' }, 'college');
  assertMatch('University', { label: 'University' }, 'college');
  assertMatch('Name of institution', { label: 'Name of institution' }, 'college');

  console.log('\n--- 4. Testing Flight / Travel Booking Questions ---');
  assertMatch('Passenger First Name', { label: 'Passenger First Name', context: 'Passenger 1' }, 'firstName');
  assertMatch('Passport Number', { label: 'Passport Number' }, 'passportNumber');
  assertMatch('Passport No.', { label: 'Passport No.' }, 'passportNumber');
  assertMatch('Country of Issue', { label: 'Country of Issue', context: 'Travel Documents' }, 'passportCountry');
  assertMatch('TSA PreCheck', { label: 'TSA PreCheck' }, 'knownTravelerNumber');
  assertMatch('Emergency Contact Name', { label: 'Emergency Contact Person', context: 'Emergency Contact' }, 'emergencyContactName');
  assertMatch('Emergency Contact Phone', { label: 'Emergency Phone', context: 'Emergency Contact' }, 'emergencyContactPhone');

  console.log('\n--- 5. Testing Job Search / Application Questions ---');
  assertMatch('Notice Period', { label: 'Notice Period' }, 'noticePeriod');
  assertMatch('Expected CTC', { label: 'Expected Salary' }, 'expectedCtc');
  assertMatch('Work Authorization', { label: 'Are you authorized to work in the US?' }, 'workAuthorization');
  assertMatch('LinkedIn URL', { label: 'LinkedIn profile url' }, 'linkedin');
  assertMatch('Experience in years', { label: 'Years of relevant experience' }, 'yearsOfExperience');

  console.log('\n--- 6. Testing HTML5 Autocomplete Attributes ---');
  assertMatch('Autocomplete given-name', { autocomplete: 'given-name' }, 'firstName', 1.0);
  assertMatch('Autocomplete family-name', { autocomplete: 'family-name' }, 'lastName', 1.0);
  assertMatch('Autocomplete email', { autocomplete: 'email' }, 'email', 1.0);
  assertMatch('Autocomplete tel', { autocomplete: 'tel' }, 'phone', 1.0);

  console.log('\n--- 7. Testing Low-Confidence / Non-Matching Questions ---');
  assertMatch('Essay question', { label: 'Why do you want to join our company?' }, undefined);
  assertMatch('Open-ended hobby', { label: 'Describe your favorite weekend hobby' }, undefined);
  assertMatch('Arbitrary question', { label: 'What is the capital of France?' }, undefined);

  console.log('\n--- 8. Regression Tests: Phone & Contact Disambiguation ---');
  assertMatch('Contact Number', { label: 'Contact Number' }, 'phone', 0.95);
  assertMatch('Contact No.', { label: 'Contact No.' }, 'phone', 0.95);
  assertMatch('contact number (lowercase)', { label: 'contact number' }, 'phone', 0.95);
  assertMatch('CONTACT-NUMBER (hyphenated uppercase)', { label: 'CONTACT-NUMBER' }, 'phone', 0.95);
  assertMatch('Mobile No', { label: 'Mobile No' }, 'phone', 0.95);
  assertMatch('Mobile Number', { label: 'Mobile Number' }, 'phone', 0.95);
  assertMatch('Telephone Number', { label: 'Telephone Number' }, 'phone', 0.95);
  assertMatch('Contact Phone', { label: 'Contact Phone' }, 'phone', 0.95);
  assertMatch('Primary Contact Number', { label: 'Primary Contact Number' }, 'phone', 0.95);
  assertMatch('Cell Number', { label: 'Cell Number' }, 'phone', 0.95);
  assertMatch('Contact Number (with country code)', { label: 'Contact Number (with country code)' }, 'phone', 0.95);
  assertMatch('Emergency Contact', { label: 'Emergency Contact' }, 'emergencyContactName', 0.95);
  assertMatch('Emergency Contact Name', { label: 'Emergency Contact Name' }, 'emergencyContactName', 0.95);
  assertMatch('Emergency Contact Phone', { label: 'Emergency Contact Phone' }, 'emergencyContactPhone', 0.95);
  assertMatch('Emergency Contact No.', { label: 'Emergency Contact No.' }, 'emergencyContactPhone', 0.95);
  assertMatch('Disambiguation: "Contact" alone MUST NOT map to phone', { label: 'Contact' }, undefined);

  console.log('\n--- 9. Regression Tests: Expanded Semantic Equivalencies Across Categories ---');
  assertMatch('Given Name', { label: 'Given Name' }, 'firstName', 0.95);
  assertMatch('Surname', { label: 'Surname' }, 'lastName', 0.95);
  assertMatch('Legal Name', { label: 'Legal Name' }, 'fullName', 0.95);
  assertMatch('Postal Code', { label: 'Postal Code' }, 'zipCode', 0.95);
  assertMatch('PIN Code', { label: 'PIN Code' }, 'zipCode', 0.95);
  assertMatch('Province', { label: 'Province' }, 'state', 0.95);
  assertMatch('Current City', { label: 'Current City' }, 'city', 0.95);
  assertMatch('Alma Mater', { label: 'Alma Mater' }, 'college', 0.95);
  assertMatch('Qualification', { label: 'Qualification' }, 'degree', 0.95);
  assertMatch('Year of Graduation', { label: 'Year of Graduation' }, 'gradYear', 0.95);
  assertMatch('Current Employer', { label: 'Current Employer' }, 'company', 0.95);
  assertMatch('Designation', { label: 'Designation' }, 'jobTitle', 0.95);
  assertMatch('Total Work Experience', { label: 'Total Work Experience' }, 'yearsOfExperience', 0.95);
  assertMatch('Passport Issuing Country', { label: 'Passport Issuing Country' }, 'passportCountry', 0.95);
  assertMatch('Travel Document Number', { label: 'Travel Document Number' }, 'passportNumber', 0.95);
  assertMatch('Expected Compensation', { label: 'Expected Compensation' }, 'expectedCtc', 0.95);
  assertMatch('Joining Notice', { label: 'Joining Notice' }, 'noticePeriod', 0.95);
  assertMatch('Availability to Join', { label: 'Availability to Join' }, 'noticePeriod', 0.95);

  console.log('\n--- 10. Regression Tests: Composite & Derived Profile Field Values ---');
  // Scenario: Profile has firstName="Tanvi", lastName="Chhaparia", fullName=""
  {
    const customProf = JSON.parse(JSON.stringify(profile));
    customProf.fields['firstName'].value = 'Tanvi';
    customProf.fields['lastName'].value = 'Chhaparia';
    customProf.fields['fullName'].value = '';

    const res = matchQuestionToField({ id: 'full_name_test', label: 'Full Name', type: 'text' }, customProf);
    if (
      res.selectedFieldKey === 'fullName' &&
      res.assignedValue === 'Tanvi Chhaparia' &&
      res.isDerived === true &&
      res.confidenceTier === 'high' &&
      res.enabled === true
    ) {
      console.log(`  ✓ PASS: Derived "Full Name" -> "${res.assignedValue}" (from First Name + Last Name)`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Derived "Full Name" -> Key: ${res.selectedFieldKey}, Value: "${res.assignedValue}", Enabled: ${res.enabled}`);
      failed++;
    }

    const resName = matchQuestionToField({ id: 'name_test', label: 'Name', type: 'text' }, customProf);
    if (resName.selectedFieldKey === 'fullName' && resName.assignedValue === 'Tanvi Chhaparia') {
      console.log(`  ✓ PASS: Question "Name" -> derived "${resName.assignedValue}"`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Question "Name" -> ${resName.assignedValue}`);
      failed++;
    }

    // Reverse derivation: fullName="Alex Mercer" -> firstName="Alex", lastName="Mercer"
    const revProf = JSON.parse(JSON.stringify(profile));
    revProf.fields['fullName'].value = 'Alex Mercer';
    revProf.fields['firstName'].value = '';
    revProf.fields['lastName'].value = '';

    const resFirst = matchQuestionToField({ id: 'fname_test', label: 'First Name', type: 'text' }, revProf);
    if (resFirst.selectedFieldKey === 'firstName' && resFirst.assignedValue === 'Alex') {
      console.log(`  ✓ PASS: Derived "First Name" -> "${resFirst.assignedValue}" from Full Name`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Derived "First Name" -> ${resFirst.assignedValue}`);
      failed++;
    }

    const resLast = matchQuestionToField({ id: 'lname_test', label: 'Last Name', type: 'text' }, revProf);
    if (resLast.selectedFieldKey === 'lastName' && resLast.assignedValue === 'Mercer') {
      console.log(`  ✓ PASS: Derived "Last Name" -> "${resLast.assignedValue}" from Full Name`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Derived "Last Name" -> ${resLast.assignedValue}`);
      failed++;
    }

    // Location derivation: city="San Francisco", state="CA", country="USA"
    const locProf = JSON.parse(JSON.stringify(profile));
    locProf.fields['city'].value = 'San Francisco';
    locProf.fields['state'].value = 'CA';
    locProf.fields['country'].value = 'USA';

    const resLoc = matchQuestionToField({ id: 'loc_test', label: 'Current Location', type: 'text' }, locProf);
    if (resLoc.assignedValue === 'San Francisco, CA, USA') {
      console.log(`  ✓ PASS: Derived "Current Location" -> "${resLoc.assignedValue}" from City, State, Country`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Derived "Current Location" -> ${resLoc.assignedValue}`);
      failed++;
    }
  }

  console.log('\n--- 11. Strict Safety: Security & Credential Field Exclusions ---');
  assertMatch('Password exclusion', { label: 'Password' }, undefined);
  assertMatch('Confirm Password exclusion', { label: 'Confirm Password' }, undefined);
  assertMatch('OTP code exclusion', { label: 'Enter OTP Code' }, undefined);
  assertMatch('CVV/CVC exclusion', { label: 'CVV / CVC' }, undefined);
  assertMatch('Banking PIN exclusion', { label: 'Banking PIN' }, undefined);
  assertMatch('API Key exclusion', { label: 'Your API Key' }, undefined);
  assertMatch('Security Answer exclusion', { label: 'Security Question Answer' }, undefined);

  console.log('\n--- 12. Safety: Preservation of Existing Non-Empty Values ---');
  {
    const existingField = {
      id: 'existing_val_test',
      label: 'Email',
      type: 'email' as const,
      hasExistingValue: true,
      existingValue: 'user_typed@company.com'
    };
    const resExisting = matchQuestionToField(existingField, profile);
    if (resExisting.selectedFieldKey === 'email' && resExisting.enabled === false && resExisting.requiresExplicitOptIn === true) {
      console.log('  ✓ PASS: Non-empty existing value preserved (enabled=false by default, explicit confirmation required)');
      passed++;
    } else {
      console.error(`  ✗ FAIL: Existing value was enabled=${resExisting.enabled}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
