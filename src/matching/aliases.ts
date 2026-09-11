/**
 * Comprehensive dictionary of aliases, keywords, and autocomplete attributes
 * for universal form field matching across:
 * - Google Forms
 * - Job Search / Applications (Greenhouse, Lever, Workday, etc.)
 * - Flight & Travel Booking Portals (Airlines, OTA)
 * - General Registration & E-Commerce Forms
 */

export interface FieldAliasConfig {
  autocomplete: string[];
  exactAliases: string[];
  keywords: string[];
  negativeKeywords?: string[]; // keywords that disqualify this match
}

export const FIELD_ALIASES: Record<string, FieldAliasConfig> = {
  // Personal
  firstName: {
    autocomplete: ['given-name', 'fname', 'first-name'],
    exactAliases: [
      'first name',
      'given name',
      'forename',
      'passenger first name',
      'applicant first name',
      'candidate first name',
      'fname',
      'first_name',
      'firstname',
      'given / first name',
      '1st name'
    ],
    keywords: ['first name', 'given name', 'fname', 'forename'],
    negativeKeywords: ['last', 'sur', 'family', 'full', 'middle']
  },

  lastName: {
    autocomplete: ['family-name', 'lname', 'last-name', 'surname'],
    exactAliases: [
      'last name',
      'family name',
      'surname',
      'passenger last name',
      'applicant last name',
      'candidate last name',
      'lname',
      'last_name',
      'lastname',
      'family / last name',
      '2nd name'
    ],
    keywords: ['last name', 'family name', 'surname', 'lname'],
    negativeKeywords: ['first', 'given', 'forename', 'full', 'middle']
  },

  fullName: {
    autocomplete: ['name'],
    exactAliases: [
      'full name',
      'name',
      'your name',
      'your full name',
      'complete name',
      'applicant name',
      'passenger name',
      'candidate name',
      'legal name',
      'name in full',
      'person name',
      'name of applicant',
      'name of candidate'
    ],
    keywords: ['full name', 'your name', 'candidate name', 'applicant name', 'passenger name', 'legal name'],
    negativeKeywords: [
      'first',
      'last',
      'sur',
      'given',
      'family',
      'company',
      'institution',
      'school',
      'emergency',
      'file',
      'user',
      'middle',
      'father',
      'mother',
      'spouse'
    ]
  },

  dob: {
    autocomplete: ['bday', 'birthdate', 'dob'],
    exactAliases: [
      'date of birth',
      'birth date',
      'dob',
      'birthdate',
      'd.o.b.',
      'passenger date of birth'
    ],
    keywords: ['birth date', 'date of birth', 'dob', 'born'],
    negativeKeywords: ['place', 'city', 'country']
  },

  gender: {
    autocomplete: ['sex'],
    exactAliases: ['gender', 'sex', 'select gender'],
    keywords: ['gender', 'sex'],
    negativeKeywords: []
  },

  // Contact
  email: {
    autocomplete: ['email', 'user-email', 'e-mail'],
    exactAliases: [
      'email',
      'email address',
      'e-mail',
      'e-mail address',
      'contact email',
      'your email',
      'personal email',
      'work email',
      'primary email',
      'electronic mail',
      'email id',
      'mail id',
      'applicant email',
      'candidate email',
      'passenger email'
    ],
    keywords: ['email', 'e-mail', 'email id', 'mail id'],
    negativeKeywords: ['alt', 'alternate', 'secondary', 'reference', 'emergency']
  },

  phone: {
    autocomplete: ['tel', 'mobile', 'tel-national'],
    exactAliases: [
      'phone',
      'phone number',
      'phone no',
      'phone number',
      'mobile',
      'mobile number',
      'mobile no',
      'mobile phone',
      'contact number',
      'contact no',
      'contact phone',
      'telephone',
      'telephone number',
      'telephone no',
      'cell phone',
      'cell number',
      'cell no',
      'primary phone',
      'primary phone number',
      'primary contact number',
      'primary contact no',
      'primary mobile',
      'primary mobile number',
      'cellular phone',
      'cell',
      'contact #'
    ],
    keywords: ['phone', 'mobile', 'cell', 'telephone', 'contact number', 'contact phone', 'cellular'],
    // Note: 'emergency' is strictly negative keyword to guarantee 'emergency contact' never maps to phone
    negativeKeywords: ['alt', 'alternate', 'secondary', 'fax', 'emergency', 'office', 'home', 'work']
  },

  altPhone: {
    autocomplete: [],
    exactAliases: [
      'alternate phone',
      'alternate phone number',
      'secondary phone',
      'secondary phone number',
      'alt phone',
      'alternative phone',
      'alternative contact number',
      'alternative contact no',
      'secondary contact number',
      'backup phone',
      'backup contact number',
      'other phone',
      'other phone number'
    ],
    keywords: ['alternate phone', 'secondary phone', 'alt phone', 'backup phone', 'alternative contact'],
    negativeKeywords: ['primary']
  },

  // Address
  addressLine1: {
    autocomplete: ['address-line1', 'street-address'],
    exactAliases: [
      'address',
      'street address',
      'address line 1',
      'address 1',
      'residential address',
      'current address',
      'where do you currently reside',
      'residence',
      'mailing address',
      'permanent address',
      'home address',
      'physical address',
      'line 1'
    ],
    keywords: ['street address', 'address line 1', 'reside', 'current address', 'mailing address'],
    negativeKeywords: ['line 2', 'email', 'ip', 'web']
  },

  addressLine2: {
    autocomplete: ['address-line2'],
    exactAliases: [
      'address line 2',
      'address 2',
      'apt',
      'suite',
      'unit',
      'apartment',
      'building'
    ],
    keywords: ['address line 2', 'apt', 'suite', 'unit'],
    negativeKeywords: ['line 1']
  },

  city: {
    autocomplete: ['address-level2'],
    exactAliases: [
      'city',
      'town',
      'municipality',
      'city of residence',
      'current city',
      'city / town',
      'location',
      'current location',
      'your location',
      'city, state',
      'city / state'
    ],
    keywords: ['city', 'town', 'municipality', 'current location'],
    negativeKeywords: ['zip', 'postal', 'issuing']
  },

  state: {
    autocomplete: ['address-level1'],
    exactAliases: [
      'state',
      'province',
      'region',
      'state / province',
      'state / region',
      'state or province',
      'territory'
    ],
    keywords: ['state', 'province', 'region'],
    negativeKeywords: ['country', 'city', 'united', 'zip']
  },

  country: {
    autocomplete: ['country', 'country-name'],
    exactAliases: [
      'country',
      'nation',
      'country of residence',
      'current country',
      'country / region',
      'citizenship country'
    ],
    keywords: ['country', 'nation'],
    negativeKeywords: ['issuing', 'passport', 'issue', 'birth', 'origin']
  },

  zipCode: {
    autocomplete: ['postal-code', 'zip-code'],
    exactAliases: [
      'zip',
      'zip code',
      'postal code',
      'postcode',
      'pincode',
      'pin code',
      'zip / postal code',
      'postal / zip code',
      'zip / pin code'
    ],
    keywords: ['zip', 'postal', 'postcode', 'pincode'],
    negativeKeywords: []
  },

  // Education
  school: {
    autocomplete: [],
    exactAliases: ['school', 'high school', 'secondary school', 'name of school'],
    keywords: ['high school', 'secondary school'],
    negativeKeywords: ['college', 'university', 'grad']
  },

  college: {
    autocomplete: [],
    exactAliases: [
      'college',
      'university',
      'institution',
      'name of institution',
      'college/university',
      'higher education institute',
      'institute name',
      'educational institution',
      'alma mater',
      'name of college',
      'name of university',
      'school / college / university',
      'college or university'
    ],
    keywords: ['college', 'university', 'institution', 'campus', 'alma mater'],
    negativeKeywords: ['high school', 'secondary school', 'company', 'employer', 'work']
  },

  degree: {
    autocomplete: [],
    exactAliases: [
      'degree',
      'highest degree',
      'qualification',
      'level of education',
      'educational qualification',
      'highest level of education',
      'academic degree',
      'highest qualification',
      'degree name',
      'degree / qualification'
    ],
    keywords: ['degree', 'bachelor', 'master', 'qualification', 'academic degree'],
    negativeKeywords: []
  },

  fieldOfStudy: {
    autocomplete: [],
    exactAliases: [
      'field of study',
      'major',
      'discipline',
      'branch of study',
      'stream',
      'area of study',
      'course of study',
      'specialization',
      'branch',
      'major / field of study'
    ],
    keywords: ['major', 'field of study', 'discipline', 'stream', 'specialization'],
    negativeKeywords: []
  },

  gradYear: {
    autocomplete: [],
    exactAliases: [
      'graduation year',
      'year of graduation',
      'year of completion',
      'passing year',
      'year of passing',
      'grad year',
      'completion year',
      'batch',
      'class of'
    ],
    keywords: ['graduation year', 'grad year', 'passing year', 'year of graduation'],
    negativeKeywords: ['experience', 'birth', 'dob']
  },

  // Work
  occupation: {
    autocomplete: [],
    exactAliases: ['occupation', 'profession'],
    keywords: ['occupation', 'profession'],
    negativeKeywords: []
  },

  jobTitle: {
    autocomplete: ['organization-title'],
    exactAliases: [
      'job title',
      'current role',
      'designation',
      'position',
      'role',
      'current designation',
      'current position',
      'current job title',
      'professional title',
      'present designation'
    ],
    keywords: ['job title', 'designation', 'current title', 'current role', 'current position'],
    negativeKeywords: ['company', 'organization', 'employer']
  },

  company: {
    autocomplete: ['organization'],
    exactAliases: [
      'company',
      'organization',
      'current company',
      'employer',
      'current employer',
      'workplace',
      'company name',
      'name of employer',
      'present employer',
      'current firm',
      'present company'
    ],
    keywords: ['current company', 'employer', 'workplace', 'company name'],
    negativeKeywords: ['why', 'join', 'interested', 'about', 'hear', 'institution', 'college', 'school', 'previous', 'past']
  },

  industry: {
    autocomplete: [],
    exactAliases: ['industry', 'sector'],
    keywords: ['industry', 'sector'],
    negativeKeywords: []
  },

  yearsOfExperience: {
    autocomplete: [],
    exactAliases: [
      'years of experience',
      'total experience',
      'relevant experience',
      'work experience',
      'experience in years',
      'years of relevant experience',
      'overall experience',
      'total years of experience',
      'total work experience',
      'experience'
    ],
    keywords: ['years of experience', 'total experience', 'work experience', 'relevant experience'],
    negativeKeywords: ['graduation', 'grad', 'birth']
  },

  // Online
  linkedin: {
    autocomplete: [],
    exactAliases: [
      'linkedin',
      'linkedin profile',
      'linkedin url',
      'linkedin link',
      'linkedin address',
      'linkedin profile url',
      'public linkedin profile'
    ],
    keywords: ['linkedin'],
    negativeKeywords: []
  },

  github: {
    autocomplete: [],
    exactAliases: [
      'github',
      'github profile',
      'github url',
      'github link',
      'github handle',
      'github username',
      'github account'
    ],
    keywords: ['github'],
    negativeKeywords: []
  },

  portfolio: {
    autocomplete: [],
    exactAliases: [
      'portfolio',
      'portfolio url',
      'portfolio website',
      'personal portfolio',
      'portfolio link',
      'design portfolio',
      'online portfolio'
    ],
    keywords: ['portfolio'],
    negativeKeywords: []
  },

  website: {
    autocomplete: ['url'],
    exactAliases: ['website', 'personal website', 'blog', 'site', 'personal site', 'web page', 'homepage', 'web site'],
    keywords: ['website', 'personal site'],
    negativeKeywords: ['linkedin', 'github', 'portfolio', 'company', 'employer']
  },

  // Travel / Flight Booking
  passportNumber: {
    autocomplete: [],
    exactAliases: [
      'passport number',
      'passport no',
      'passport no.',
      'passport #',
      'travel document number',
      'passport id',
      'passport document number',
      'passport / travel document number'
    ],
    keywords: ['passport number', 'passport no', 'travel document'],
    negativeKeywords: ['expiry', 'expiration', 'country', 'issue', 'date', 'place']
  },

  passportExpiry: {
    autocomplete: [],
    exactAliases: [
      'passport expiry',
      'passport expiration date',
      'passport expiry date',
      'expiry date of passport',
      'document expiration',
      'passport valid until',
      'passport expiration'
    ],
    keywords: ['passport expiry', 'passport expiration', 'document expiration'],
    negativeKeywords: ['number', 'no', 'issue', 'country']
  },

  nationality: {
    autocomplete: [],
    exactAliases: ['nationality', 'citizenship', 'country of citizenship'],
    keywords: ['nationality', 'citizenship'],
    negativeKeywords: []
  },

  passportCountry: {
    autocomplete: [],
    exactAliases: [
      'passport issuing country',
      'country of issue',
      'issuing country',
      'passport country',
      'country of passport issuance',
      'issuing authority / country'
    ],
    keywords: ['country of issue', 'issuing country'],
    negativeKeywords: ['residence', 'birth', 'current']
  },

  knownTravelerNumber: {
    autocomplete: [],
    exactAliases: [
      'known traveler number',
      'ktn',
      'tsa precheck',
      'tsa pre-check',
      'redress number',
      'frequent flyer number',
      'loyalty number'
    ],
    keywords: ['known traveler', 'ktn', 'tsa pre', 'redress', 'frequent flyer'],
    negativeKeywords: []
  },

  emergencyContactName: {
    autocomplete: [],
    exactAliases: [
      'emergency contact',
      'emergency contact name',
      'emergency contact person',
      'in case of emergency contact',
      'emergency name',
      'emergency contact full name'
    ],
    keywords: ['emergency contact name', 'emergency contact person'],
    negativeKeywords: ['phone', 'number', 'mobile', 'tel', 'cell', 'email', 'relation', 'relationship']
  },

  emergencyContactPhone: {
    autocomplete: [],
    exactAliases: [
      'emergency contact phone',
      'emergency phone',
      'emergency contact number',
      'emergency phone number',
      'emergency contact mobile',
      'emergency mobile',
      'emergency tel',
      'emergency contact no',
      'emergency contact no.'
    ],
    keywords: ['emergency contact phone', 'emergency phone', 'emergency number'],
    negativeKeywords: ['email', 'name', 'relation', 'address']
  },

  // Job Search / Applications
  noticePeriod: {
    autocomplete: [],
    exactAliases: [
      'notice period',
      'availability',
      'how soon can you start',
      'earliest start date',
      'start date',
      'joining notice',
      'notice period in days',
      'availability to join',
      'when can you start'
    ],
    keywords: ['notice period', 'soon can you start', 'start date', 'availability', 'joining notice'],
    negativeKeywords: []
  },

  currentCtc: {
    autocomplete: [],
    exactAliases: [
      'current ctc',
      'current salary',
      'current compensation',
      'present salary',
      'present ctc',
      'present compensation',
      'current annual salary'
    ],
    keywords: ['current ctc', 'current salary', 'current compensation'],
    negativeKeywords: ['expected', 'target', 'desired']
  },

  expectedCtc: {
    autocomplete: [],
    exactAliases: [
      'expected ctc',
      'expected salary',
      'salary expectation',
      'desired compensation',
      'target salary',
      'expected compensation',
      'expected annual salary',
      'compensation expectation',
      'desired salary',
      'compensation'
    ],
    keywords: ['expected ctc', 'expected salary', 'salary expectation', 'desired salary', 'compensation'],
    negativeKeywords: ['current', 'present']
  },

  workAuthorization: {
    autocomplete: [],
    exactAliases: [
      'work authorization',
      'are you authorized to work',
      'visa status',
      'sponsorship required',
      'will you now or in the future require sponsorship',
      'eligible to work',
      'legal authorization to work',
      'work permit status'
    ],
    keywords: ['work authorization', 'authorized to work', 'visa status', 'require sponsorship', 'eligible to work'],
    negativeKeywords: []
  },

  willingToRelocate: {
    autocomplete: [],
    exactAliases: [
      'willing to relocate',
      'relocation',
      'are you willing to relocate',
      'open to relocate'
    ],
    keywords: ['relocate', 'relocation'],
    negativeKeywords: []
  }
};
