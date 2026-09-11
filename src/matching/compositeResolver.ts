import { Profile } from '../shared/types';

export interface ResolvedFieldValue {
  value: string;
  isDerived: boolean;
  derivedReason?: string;
}

/**
 * Resolves a profile field's value either from direct saved profile data
 * or by intelligently deriving / combining composite fields (e.g. First Name + Last Name -> Full Name).
 */
export function resolveProfileFieldValue(
  fieldKey: string,
  profile: Profile,
  fieldContext?: { label?: string; context?: string }
): ResolvedFieldValue {
  const directField = profile.fields[fieldKey];
  const directValue = directField?.value?.trim() || '';

  // Check explicit composite queries first when the form requests combined details
  if (fieldKey === 'city') {
    const labelLower = (fieldContext?.label || '').toLowerCase();
    const isLocationQuery = /location|current location|city\s*,\s*state|city\s*\/\s*state/i.test(labelLower);

    if (isLocationQuery) {
      const city = profile.fields['city']?.value?.trim() || '';
      const state = profile.fields['state']?.value?.trim() || '';
      const country = profile.fields['country']?.value?.trim() || '';
      const parts = [city, state, country].filter(Boolean);
      if (parts.length >= 2) {
        return {
          value: parts.join(', '),
          isDerived: true,
          derivedReason: 'Combined City, State, Country location'
        };
      }
    }
  }

  if (fieldKey === 'addressLine1') {
    const labelLower = (fieldContext?.label || '').toLowerCase();
    const isFullAddressQuery = /full address|complete address|entire address|mailing address|full street address/i.test(
      labelLower
    );

    if (isFullAddressQuery) {
      const addr1 = profile.fields['addressLine1']?.value?.trim() || '';
      const city = profile.fields['city']?.value?.trim() || '';
      const state = profile.fields['state']?.value?.trim() || '';
      const zip = profile.fields['zipCode']?.value?.trim() || '';
      const country = profile.fields['country']?.value?.trim() || '';

      const parts = [addr1, city, state, zip, country].filter(Boolean);
      if (parts.length >= 2) {
        return {
          value: parts.join(', '),
          isDerived: true,
          derivedReason: 'Combined address components (Street, City, State, ZIP, Country)'
        };
      }
    }
  }

  // Direct saved value is preferred for standard specific fields
  if (directValue) {
    return {
      value: directValue,
      isDerived: false
    };
  }

  // 2. Composite Derivation: First Name + Last Name -> Full Name
  if (fieldKey === 'fullName') {
    const fName = profile.fields['firstName']?.value?.trim() || '';
    const lName = profile.fields['lastName']?.value?.trim() || '';

    if (fName && lName) {
      return {
        value: `${fName} ${lName}`,
        isDerived: true,
        derivedReason: 'Combined from First Name and Last Name'
      };
    }
    if (fName) {
      return {
        value: fName,
        isDerived: true,
        derivedReason: 'Derived from First Name'
      };
    }
    if (lName) {
      return {
        value: lName,
        isDerived: true,
        derivedReason: 'Derived from Last Name'
      };
    }
  }

  // 3. Reverse Derivation: Full Name -> First Name / Last Name
  if (fieldKey === 'firstName' && !directValue) {
    const fullName = profile.fields['fullName']?.value?.trim() || '';
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        return {
          value: parts[0],
          isDerived: true,
          derivedReason: 'Derived from Full Name'
        };
      }
    }
  }

  if (fieldKey === 'lastName' && !directValue) {
    const fullName = profile.fields['fullName']?.value?.trim() || '';
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        return {
          value: parts.slice(1).join(' '),
          isDerived: true,
          derivedReason: 'Derived from Full Name'
        };
      }
    }
  }

  // 4. Composite Address: Street + City + State + ZIP + Country -> Full Address
  if (fieldKey === 'addressLine1') {
    const labelLower = (fieldContext?.label || '').toLowerCase();
    const isFullAddressQuery = /full address|complete address|entire address|mailing address|full street address/i.test(
      labelLower
    );

    if (isFullAddressQuery) {
      const addr1 = profile.fields['addressLine1']?.value?.trim() || '';
      const city = profile.fields['city']?.value?.trim() || '';
      const state = profile.fields['state']?.value?.trim() || '';
      const zip = profile.fields['zipCode']?.value?.trim() || '';
      const country = profile.fields['country']?.value?.trim() || '';

      const parts = [addr1, city, state, zip, country].filter(Boolean);
      if (parts.length >= 2) {
        return {
          value: parts.join(', '),
          isDerived: true,
          derivedReason: 'Combined address components (Street, City, State, ZIP, Country)'
        };
      }
    }
  }

  // 5. Composite Location: City + State + Country
  if (fieldKey === 'city') {
    const labelLower = (fieldContext?.label || '').toLowerCase();
    const isLocationQuery = /location|current location|city\s*,\s*state|city\s*\/\s*state/i.test(labelLower);

    if (isLocationQuery) {
      const city = profile.fields['city']?.value?.trim() || '';
      const state = profile.fields['state']?.value?.trim() || '';
      const country = profile.fields['country']?.value?.trim() || '';
      const parts = [city, state, country].filter(Boolean);
      if (parts.length >= 2) {
        return {
          value: parts.join(', '),
          isDerived: true,
          derivedReason: 'Combined City, State, Country location'
        };
      }
    }
  }

  return {
    value: '',
    isDerived: false
  };
}
