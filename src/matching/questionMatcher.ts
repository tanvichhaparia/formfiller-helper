import {
  DetectedFormField,
  Profile,
  MatchCandidate,
  FormFieldMatchItem,
  LearnedMapping,
  ConfidenceTier
} from '../shared/types';
import { FIELD_ALIASES } from './aliases';
import { normalizeQuestionText, cleanQuestionNoise } from './normalization';
import { resolveProfileFieldValue } from './compositeResolver';

/**
 * Checks if a question or field key pertains to sensitive personal or identity information.
 */
export function isSensitiveFieldQuestion(text: string, fieldKey?: string): boolean {
  if (fieldKey) {
    const sensitiveKeys = [
      'passportNumber',
      'passportExpiry',
      'passportCountry',
      'knownTravelerNumber',
      'emergencyContactName',
      'emergencyContactPhone'
    ];
    if (sensitiveKeys.includes(fieldKey)) return true;
  }

  const norm = normalizeQuestionText(text);
  const sensitivePatterns = [
    'passport',
    'ssn',
    'social security',
    'national id',
    'aadhar',
    'tax id',
    'driver license',
    'drivers license',
    'emergency contact'
  ];

  return sensitivePatterns.some((p) => norm.includes(p));
}

/**
 * Checks if a question corresponds to forbidden security or credential fields.
 */
export function isForbiddenQuestion(label: string, name: string, autocomplete?: string): boolean {
  const ac = (autocomplete || '').toLowerCase();
  const forbiddenAutocomplete = [
    'current-password',
    'new-password',
    'one-time-code',
    'cc-csc',
    'cc-exp',
    'cc-number',
    'transaction-currency',
    'transaction-amount'
  ];
  if (forbiddenAutocomplete.some((a) => ac.includes(a))) return true;

  const combined = `${label} ${name}`.toLowerCase();
  const forbiddenPatterns = [
    /\bpassword\b/,
    /\bpasswd\b/,
    /\bpwd\b/,
    /\bconfirm password\b/,
    /\botp\b/,
    /\bone time (?:password|code|pin)\b/,
    /\bpasscode\b/,
    /\bsecurity code\b/,
    /\bverification code\b/,
    /\bcvv\b/,
    /\bcvc\b/,
    /\bcard verification\b/,
    /\bbanking pin\b/,
    /\bcard pin\b/,
    /\batm pin\b/,
    /\bapi[_\s-]?key\b/,
    /\bsecret[_\s-]?key\b/,
    /\bprivate[_\s-]?key\b/,
    /\bauth[_\s-]?token\b/,
    /\bbearer token\b/,
    /\baccess[_\s-]?token\b/,
    /\bsecurity answer\b/,
    /\bsecurity question\b/,
    /\bmother'?s? maiden name\b/,
    /\bcaptcha\b/
  ];

  return forbiddenPatterns.some((pat) => pat.test(combined));
}

/**
 * Calculates match confidence between a detected form question and a profile field.
 * Enforces behavior-driven confidence tiers and explicit opt-in for sensitive fields.
 */
export function matchQuestionToField(
  field: DetectedFormField,
  profile: Profile,
  learnedMappings: Record<string, LearnedMapping> = {}
): FormFieldMatchItem {
  const rawLabel = (field.label || '').trim();
  const rawName = (field.name || '').trim();
  const rawPlaceholder = (field.placeholder || '').trim();
  const rawContext = (field.context || '').trim();
  const autocomplete = (field.autocomplete || '').toLowerCase().trim();

  // CRITICAL SAFETY RULE: Never autofill passwords, OTP, CVV, PINs, auth tokens, or security questions
  if (isForbiddenQuestion(rawLabel, rawName, autocomplete)) {
    return {
      detectedField: field,
      selectedFieldKey: undefined,
      assignedValue: '',
      confidence: 0,
      confidenceTier: 'none',
      matchReason: 'Excluded security / password / credential field',
      candidates: [],
      enabled: false,
      isSensitive: true,
      requiresExplicitOptIn: true
    };
  }

  const candidates: MatchCandidate[] = [];

  const normLabel = normalizeQuestionText(rawLabel);
  const normName = normalizeQuestionText(rawName);
  const normPlaceholder = normalizeQuestionText(rawPlaceholder);
  const normContext = normalizeQuestionText(rawContext);

  const cleanLabel = cleanQuestionNoise(rawLabel);
  const cleanName = cleanQuestionNoise(rawName);

  const combinedTokens = `${normLabel} ${normName} ${normPlaceholder}`.trim();

  // 1. Check Learned Mappings (Level 1 - Explicit User Choice)
  const learned = learnedMappings[normLabel] || (normName && learnedMappings[normName]);
  if (learned && profile.fields[learned.profileFieldKey]) {
    const targetField = profile.fields[learned.profileFieldKey];
    const resolved = resolveProfileFieldValue(targetField.key, profile, {
      label: rawLabel,
      context: rawContext
    });
    const proposedVal = resolved.value || targetField.value || '';
    candidates.push({
      fieldKey: targetField.key,
      fieldLabel: targetField.label,
      category: targetField.category,
      confidence: 0.98,
      matchReason: 'User previously remembered this mapping',
      proposedValue: proposedVal,
      isSensitive: targetField.isSensitive,
      isDerived: resolved.isDerived,
      derivedReason: resolved.derivedReason
    });
  }

  // 2. Check HTML5 Autocomplete attribute (Level 2 - High Spec Certainty)
  if (autocomplete && autocomplete !== 'off' && autocomplete !== 'on') {
    for (const [key, aliasConfig] of Object.entries(FIELD_ALIASES)) {
      if (aliasConfig.autocomplete.some((ac) => autocomplete.includes(ac))) {
        const targetField = profile.fields[key];
        if (targetField) {
          const resolved = resolveProfileFieldValue(targetField.key, profile, {
            label: rawLabel,
            context: rawContext
          });
          const proposedVal = resolved.value || targetField.value || '';
          candidates.push({
            fieldKey: targetField.key,
            fieldLabel: targetField.label,
            category: targetField.category,
            confidence: 1.0,
            matchReason: `HTML5 autocomplete="${autocomplete}"`,
            proposedValue: proposedVal,
            isSensitive: targetField.isSensitive,
            isDerived: resolved.isDerived,
            derivedReason: resolved.derivedReason
          });
        }
      }
    }
  }

  // 3. Check Custom Fields in profile (including custom aliases and descriptions)
  for (const fieldKey in profile.fields) {
    const profField = profile.fields[fieldKey];
    if (!profField.isCustom) continue;

    const normCustomLabel = normalizeQuestionText(profField.label);

    // Exact label match
    if (normCustomLabel && (normLabel === normCustomLabel || normName === normCustomLabel)) {
      candidates.push({
        fieldKey: profField.key,
        fieldLabel: profField.label,
        category: profField.category,
        confidence: 0.95,
        matchReason: `Custom field exact match: "${profField.label}"`,
        proposedValue: profField.value,
        isSensitive: profField.isSensitive
      });
      continue;
    }

    // Check custom aliases
    if (profField.aliases && profField.aliases.length > 0) {
      for (const alias of profField.aliases) {
        const normAlias = normalizeQuestionText(alias);
        if (normLabel === normAlias || normName === normAlias) {
          candidates.push({
            fieldKey: profField.key,
            fieldLabel: profField.label,
            category: profField.category,
            confidence: 0.95,
            matchReason: `Custom field alias match: "${alias}"`,
            proposedValue: profField.value,
            isSensitive: profField.isSensitive
          });
          break;
        } else if (combinedTokens.includes(normAlias)) {
          candidates.push({
            fieldKey: profField.key,
            fieldLabel: profField.label,
            category: profField.category,
            confidence: 0.94,
            matchReason: `Custom field alias match: "${alias}"`,
            proposedValue: profField.value,
            isSensitive: profField.isSensitive
          });
          break;
        }
      }
    }

    // Substring containment match on label
    if (normCustomLabel && combinedTokens.includes(normCustomLabel)) {
      candidates.push({
        fieldKey: profField.key,
        fieldLabel: profField.label,
        category: profField.category,
        confidence: 0.88,
        matchReason: `Custom field label keyword match: "${profField.label}"`,
        proposedValue: profField.value,
        isSensitive: profField.isSensitive
      });
    }
  }

  // 4. Check Predefined Field Aliases & Keywords
  for (const [key, aliasConfig] of Object.entries(FIELD_ALIASES)) {
    const targetField = profile.fields[key];
    if (!targetField) continue;

    // Check negative keywords first
    if (aliasConfig.negativeKeywords && aliasConfig.negativeKeywords.length > 0) {
      const hasNegative = aliasConfig.negativeKeywords.some((neg) => {
        const pattern = new RegExp(`\\b${neg}\\b`, 'i');
        return pattern.test(normLabel) || pattern.test(normName);
      });
      if (hasNegative) {
        continue;
      }
    }

    // Resolve value (including composite derivation like firstName + lastName -> fullName)
    const resolved = resolveProfileFieldValue(targetField.key, profile, {
      label: rawLabel,
      context: rawContext
    });
    const proposedVal = resolved.value || targetField.value || '';

    // A. Exact alias match (including normalized and noise-cleaned variants)
    const exactMatch = aliasConfig.exactAliases.some((alias) => {
      const normAlias = normalizeQuestionText(alias);
      return (
        normLabel === normAlias ||
        normName === normAlias ||
        normPlaceholder === normAlias ||
        cleanLabel === normAlias ||
        cleanName === normAlias
      );
    });

    if (exactMatch) {
      let confidence = 0.95;
      if (normContext.includes('emergency') && key.startsWith('emergency')) {
        confidence = 0.96;
      }
      candidates.push({
        fieldKey: targetField.key,
        fieldLabel: targetField.label,
        category: targetField.category,
        confidence,
        matchReason: resolved.isDerived
          ? `Exact match for "${targetField.label}" (${resolved.derivedReason})`
          : `Exact match for "${targetField.label}"`,
        proposedValue: proposedVal,
        isSensitive: targetField.isSensitive,
        isDerived: resolved.isDerived,
        derivedReason: resolved.derivedReason
      });
      continue;
    }

    // B. Keyword match
    for (const kw of aliasConfig.keywords) {
      const normKw = normalizeQuestionText(kw);
      if (normLabel.includes(normKw) || normName.includes(normKw) || normPlaceholder.includes(normKw)) {
        let conf = 0.80;
        if (normContext.includes('passenger') && (key === 'firstName' || key === 'lastName' || key === 'dob')) {
          conf = 0.88;
        }
        if (normContext.includes('applicant') || normContext.includes('candidate')) {
          conf = 0.88;
        }
        candidates.push({
          fieldKey: targetField.key,
          fieldLabel: targetField.label,
          category: targetField.category,
          confidence: conf,
          matchReason: resolved.isDerived
            ? `Keyword match "${kw}" for ${targetField.label} (${resolved.derivedReason})`
            : `Keyword match "${kw}" for ${targetField.label}`,
          proposedValue: proposedVal,
          isSensitive: targetField.isSensitive,
          isDerived: resolved.isDerived,
          derivedReason: resolved.derivedReason
        });
        break;
      }
    }
  }

  // Deduplicate and sort candidates by confidence descending
  const uniqueCandidatesMap = new Map<string, MatchCandidate>();
  for (const c of candidates) {
    const existing = uniqueCandidatesMap.get(c.fieldKey);
    if (!existing || existing.confidence < c.confidence) {
      uniqueCandidatesMap.set(c.fieldKey, c);
    }
  }

  const sortedCandidates = Array.from(uniqueCandidatesMap.values()).sort(
    (a, b) => b.confidence - a.confidence
  );

  const bestMatch = sortedCandidates[0];

  // Determine Confidence Tier
  let confidenceTier: ConfidenceTier = 'none';
  if (bestMatch) {
    if (bestMatch.confidence >= 0.95) {
      confidenceTier = 'high';
    } else if (bestMatch.confidence >= 0.85) {
      confidenceTier = 'review';
    } else if (bestMatch.confidence >= 0.70) {
      confidenceTier = 'manual';
    }
  }

  const isSensitive = Boolean(
    (bestMatch && bestMatch.isSensitive) ||
    isSensitiveFieldQuestion(rawLabel, bestMatch?.fieldKey)
  );

  const hasExisting = Boolean(
    field.hasExistingValue && field.existingValue && field.existingValue.trim().length > 0
  );

  // If match has confidence >= 0.70
  if (bestMatch && confidenceTier !== 'none') {
    const hasValue = Boolean(bestMatch.proposedValue && bestMatch.proposedValue.trim().length > 0);

    // CRITICAL SAFETY RULES:
    // 1. Sensitive fields ALWAYS require explicit opt-in. Never enabled by default!
    // 2. Existing non-empty user value in DOM: NEVER overwrite by default! Requires explicit confirmation.
    // 3. Non-sensitive fields: enabled only if High/Review confidence (>= 0.85), has non-empty value, and no existing value.
    const shouldEnable = !isSensitive && !hasExisting && confidenceTier !== 'manual' && hasValue;

    return {
      detectedField: field,
      selectedFieldKey: bestMatch.fieldKey,
      assignedValue: bestMatch.proposedValue || '',
      confidence: bestMatch.confidence,
      confidenceTier,
      matchReason: bestMatch.matchReason,
      candidates: sortedCandidates,
      enabled: shouldEnable,
      isSensitive,
      requiresExplicitOptIn: isSensitive || hasExisting,
      isDerived: bestMatch.isDerived,
      derivedReason: bestMatch.derivedReason,
      hasExistingValue: hasExisting,
      existingValue: field.existingValue
    };
  }

  // No confident match (confidence < 0.70)
  return {
    detectedField: field,
    selectedFieldKey: undefined,
    assignedValue: '',
    confidence: bestMatch ? bestMatch.confidence : 0,
    confidenceTier: 'none',
    matchReason: bestMatch ? 'Low confidence match (<70%)' : 'No matching profile field found',
    candidates: sortedCandidates,
    enabled: false,
    isSensitive,
    requiresExplicitOptIn: isSensitive
  };
}

/**
 * Matches an array of detected form fields against the active profile.
 */
export function matchAllDetectedFields(
  detectedFields: DetectedFormField[],
  profile: Profile,
  learnedMappings: Record<string, LearnedMapping> = {}
): FormFieldMatchItem[] {
  return detectedFields.map((field) => matchQuestionToField(field, profile, learnedMappings));
}
