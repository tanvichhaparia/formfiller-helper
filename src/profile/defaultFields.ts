import { Profile, ProfileField, StorageSchema } from '../shared/types';

export interface FieldDefinition {
  key: string;
  label: string;
  category: ProfileField['category'];
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'url' | 'number';
  isSensitive?: boolean;
  aliases?: string[];
  description?: string;
}

export const PREDEFINED_FIELDS: FieldDefinition[] = [
  // Personal
  { key: 'firstName', label: 'First Name', category: 'personal', placeholder: 'e.g. Rahul' },
  { key: 'lastName', label: 'Last Name', category: 'personal', placeholder: 'e.g. Kumar' },
  { key: 'fullName', label: 'Full Name', category: 'personal', placeholder: 'e.g. Rahul Kumar' },
  { key: 'dob', label: 'Date of Birth', category: 'personal', type: 'date', placeholder: 'YYYY-MM-DD' },
  { key: 'gender', label: 'Gender', category: 'personal', placeholder: 'e.g. Male / Female / Non-binary' },

  // Contact
  { key: 'email', label: 'Email Address', category: 'contact', type: 'email', placeholder: 'name@example.com' },
  { key: 'phone', label: 'Phone Number', category: 'contact', type: 'tel', placeholder: '+1 555-0199' },
  { key: 'altPhone', label: 'Alternate Phone Number', category: 'contact', type: 'tel', placeholder: '+1 555-0188' },

  // Address
  { key: 'addressLine1', label: 'Address Line 1', category: 'address', placeholder: 'Street name, Apt/Suite' },
  { key: 'addressLine2', label: 'Address Line 2', category: 'address', placeholder: 'Building, Landmark' },
  { key: 'city', label: 'City', category: 'address', placeholder: 'e.g. San Francisco / Bengaluru' },
  { key: 'state', label: 'State / Province', category: 'address', placeholder: 'e.g. California / Karnataka' },
  { key: 'country', label: 'Country', category: 'address', placeholder: 'e.g. United States / India' },
  { key: 'zipCode', label: 'Postal / ZIP Code', category: 'address', placeholder: 'e.g. 94103 / 560001' },

  // Education
  { key: 'school', label: 'School', category: 'education', placeholder: 'e.g. Lincoln High School' },
  { key: 'college', label: 'College / University', category: 'education', placeholder: 'e.g. Stanford University' },
  { key: 'degree', label: 'Degree', category: 'education', placeholder: 'e.g. Bachelor of Science' },
  { key: 'fieldOfStudy', label: 'Field of Study / Major', category: 'education', placeholder: 'e.g. Computer Science' },
  { key: 'gradYear', label: 'Graduation Year', category: 'education', placeholder: 'e.g. 2024' },

  // Work
  { key: 'occupation', label: 'Occupation', category: 'work', placeholder: 'e.g. Software Engineer' },
  { key: 'jobTitle', label: 'Job Title', category: 'work', placeholder: 'e.g. Senior Frontend Developer' },
  { key: 'company', label: 'Company / Organization', category: 'work', placeholder: 'e.g. Acme Corp' },
  { key: 'industry', label: 'Industry', category: 'work', placeholder: 'e.g. Technology' },
  { key: 'yearsOfExperience', label: 'Years of Experience', category: 'work', placeholder: 'e.g. 4' },

  // Online
  { key: 'linkedin', label: 'LinkedIn Profile', category: 'online', type: 'url', placeholder: 'https://linkedin.com/in/username' },
  { key: 'github', label: 'GitHub Profile', category: 'online', type: 'url', placeholder: 'https://github.com/username' },
  { key: 'portfolio', label: 'Portfolio URL', category: 'online', type: 'url', placeholder: 'https://yourportfolio.com' },
  { key: 'website', label: 'Website', category: 'online', type: 'url', placeholder: 'https://example.com' },

  // Travel / Flight Booking (Identity-related fields are flagged as sensitive)
  {
    key: 'passportNumber',
    label: 'Passport Number',
    category: 'travel',
    placeholder: 'e.g. A12345678',
    isSensitive: true,
    description: 'Government-issued passport number. Requires explicit opt-in to fill.'
  },
  {
    key: 'passportExpiry',
    label: 'Passport Expiry Date',
    category: 'travel',
    type: 'date',
    placeholder: 'YYYY-MM-DD',
    isSensitive: true,
    description: 'Passport expiration date. Requires explicit opt-in to fill.'
  },
  {
    key: 'nationality',
    label: 'Nationality / Citizenship',
    category: 'travel',
    placeholder: 'e.g. United States / India'
  },
  {
    key: 'passportCountry',
    label: 'Passport Issuing Country',
    category: 'travel',
    placeholder: 'e.g. United States',
    isSensitive: true
  },
  {
    key: 'knownTravelerNumber',
    label: 'Known Traveler / TSA PreCheck',
    category: 'travel',
    placeholder: 'e.g. 987654321',
    isSensitive: true,
    description: 'KTN / TSA PreCheck ID. Requires explicit opt-in to fill.'
  },
  {
    key: 'emergencyContactName',
    label: 'Emergency Contact Name',
    category: 'travel',
    placeholder: 'e.g. Priya Kumar',
    isSensitive: true
  },
  {
    key: 'emergencyContactPhone',
    label: 'Emergency Contact Phone',
    category: 'travel',
    type: 'tel',
    placeholder: '+1 555-0177',
    isSensitive: true
  },

  // Job Search / Applications
  { key: 'noticePeriod', label: 'Notice Period', category: 'job', placeholder: 'e.g. Immediate / 30 Days / 2 Months' },
  { key: 'currentCtc', label: 'Current Salary / CTC', category: 'job', placeholder: 'e.g. $120,000 / ₹24 LPA' },
  { key: 'expectedCtc', label: 'Expected Salary / CTC', category: 'job', placeholder: 'e.g. $140,000 / ₹30 LPA' },
  { key: 'workAuthorization', label: 'Work Authorization / Visa Status', category: 'job', placeholder: 'e.g. Citizen / Permanent Resident / H1-B' },
  { key: 'willingToRelocate', label: 'Willing to Relocate', category: 'job', placeholder: 'e.g. Yes / No / Remote Only' }
];

export const CATEGORY_METADATA: Record<ProfileField['category'], { label: string; description: string }> = {
  personal: { label: 'Personal Information', description: 'Name, birth date, and basic personal identity' },
  contact: { label: 'Contact Details', description: 'Primary & alternate communication channels' },
  address: { label: 'Address & Location', description: 'Residential or mailing address details' },
  education: { label: 'Education & Academics', description: 'Schools, colleges, degrees, and study majors' },
  work: { label: 'Employment & Career', description: 'Company, job title, occupation, and experience' },
  online: { label: 'Online Profiles & Links', description: 'LinkedIn, GitHub, website, and portfolio links' },
  travel: { label: 'Travel & Flight Details', description: 'Passport, nationality, TSA PreCheck, emergency contact' },
  job: { label: 'Job Applications', description: 'Salary expectations, notice period, work authorization' },
  custom: { label: 'Custom Fields', description: 'User-defined fields specific to your needs' }
};

export function createEmptyFieldsMap(): Record<string, ProfileField> {
  const map: Record<string, ProfileField> = {};
  for (const def of PREDEFINED_FIELDS) {
    map[def.key] = {
      id: def.key,
      key: def.key,
      label: def.label,
      value: '',
      category: def.category,
      enabled: true,
      isCustom: false,
      isSensitive: def.isSensitive || false,
      description: def.description,
      source: 'predefined'
    };
  }
  return map;
}

export function getDefaultStorageState(): StorageSchema {
  const personalProfile: Profile = {
    id: 'profile_personal',
    name: 'Personal',
    type: 'personal',
    isDefault: true,
    fields: createEmptyFieldsMap(),
    updatedAt: Date.now()
  };

  const professionalProfile: Profile = {
    id: 'profile_professional',
    name: 'Professional',
    type: 'professional',
    isDefault: false,
    fields: createEmptyFieldsMap(),
    updatedAt: Date.now()
  };

  const academicProfile: Profile = {
    id: 'profile_academic',
    name: 'Academic',
    type: 'academic',
    isDefault: false,
    fields: createEmptyFieldsMap(),
    updatedAt: Date.now()
  };

  return {
    profiles: {
      profile_personal: personalProfile,
      profile_professional: professionalProfile,
      profile_academic: academicProfile
    },
    activeProfileId: 'profile_personal',
    settings: {
      theme: 'system',
      confirmBeforeFill: true
    },
    learnedMappings: {}
  };
}
