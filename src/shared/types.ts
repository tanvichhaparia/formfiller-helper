export type FieldCategory =
  | 'personal'
  | 'contact'
  | 'address'
  | 'education'
  | 'work'
  | 'online'
  | 'travel'
  | 'job'
  | 'custom';

export interface ProfileField {
  id: string;
  key: string;
  label: string;
  value: string;
  category: FieldCategory;
  isCustom?: boolean;
  isSensitive?: boolean; // Sensitive fields require explicit opt-in before filling
  aliases?: string[];    // User-specified or learned keywords/aliases
  description?: string;
  enabled: boolean;
  source?: 'predefined' | 'custom' | 'learned';
}

export type ProfileType = 'personal' | 'professional' | 'academic' | 'travel' | 'custom';

export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  isDefault?: boolean;
  fields: Record<string, ProfileField>;
  updatedAt: number;
}

export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'system';
  confirmBeforeFill: boolean;
}

export interface LearnedMapping {
  id: string;
  questionPattern: string; // Lowercase normalized text
  profileFieldKey: string;  // Target field key
  confidence: number;
  createdAt: number;
}

export interface StorageSchema {
  profiles: Record<string, Profile>;
  activeProfileId: string;
  settings: ExtensionSettings;
  learnedMappings: Record<string, LearnedMapping>;
}

export type FormPageType = 'google_form' | 'job_application' | 'flight_booking' | 'generic_web_form';

export interface DetectedFormField {
  id: string; // Unique identifier for DOM targeting (e.g. data-formfill-id)
  label: string;
  name?: string;
  placeholder?: string;
  autocomplete?: string;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'date'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'textarea'
    | 'combobox';
  options?: { label: string; value: string }[];
  required?: boolean;
  context?: string; // Surrounding fieldset/legend or section title
  isGoogleFormsCustom?: boolean;
  isCombobox?: boolean;
  isCustomControl?: boolean;
  hasExistingValue?: boolean;
  existingValue?: string;
}

export interface FormScanResult {
  isFormDetected: boolean;
  pageType: FormPageType;
  title: string;
  fields: DetectedFormField[];
}

export interface MatchCandidate {
  fieldKey: string;
  fieldLabel: string;
  category: FieldCategory;
  confidence: number;
  matchReason: string;
  proposedValue: string;
  isSensitive?: boolean;
  isDerived?: boolean;
  derivedReason?: string;
}

export type ConfidenceTier = 'high' | 'review' | 'manual' | 'none';

export interface FormFieldMatchItem {
  detectedField: DetectedFormField;
  selectedFieldKey?: string;
  assignedValue: string;
  confidence: number;
  confidenceTier: ConfidenceTier;
  matchReason: string;
  candidates: MatchCandidate[];
  enabled: boolean;
  isSensitive?: boolean;
  requiresExplicitOptIn?: boolean;
  isDerived?: boolean;
  derivedReason?: string;
  hasExistingValue?: boolean;
  existingValue?: string;
  overwriteExisting?: boolean;
  isRememberChoice?: boolean;
  fillStatus?: 'pending' | 'success' | 'failed';
  failedReason?: string;
}

export interface FailedFieldVerification {
  fieldId: string;
  label: string;
  expected: string;
  actual: string;
  reason: string;
}

export interface FillVerificationResult {
  totalAttempted: number;
  successCount: number;
  failedCount: number;
  failedFields: FailedFieldVerification[];
}

export interface CustomFieldInput {
  name: string;
  value: string;
  category?: FieldCategory;
  aliases?: string[];
  description?: string;
  isSensitive?: boolean;
  rememberForFuture?: boolean;
}
