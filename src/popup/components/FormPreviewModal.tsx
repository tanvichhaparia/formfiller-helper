import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Check,
  X,
  ShieldAlert,
  Plus,
  AlertCircle
} from 'lucide-react';
import {
  FormFieldMatchItem,
  Profile,
  FormScanResult,
  FieldCategory,
  FillVerificationResult
} from '../../shared/types';
import { saveLearnedMapping } from '../../matching/learnedMappings';
import { addCustomField } from '../../profile/profileStore';

interface Props {
  scanResult: FormScanResult;
  initialMatches: FormFieldMatchItem[];
  activeProfile: Profile;
  onClose: () => void;
  onFill: (matches: FormFieldMatchItem[]) => Promise<FillVerificationResult | void>;
  onProfileUpdated?: () => void;
}

export const FormPreviewModal: React.FC<Props> = ({
  scanResult,
  initialMatches,
  activeProfile,
  onClose,
  onFill,
  onProfileUpdated
}) => {
  const [matches, setMatches] = useState<FormFieldMatchItem[]>(initialMatches);
  const [isFilling, setIsFilling] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<FillVerificationResult | null>(null);

  // Inline dynamic custom field creation modal state
  const [targetItemIndex, setTargetItemIndex] = useState<number | null>(null);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');
  const [newFieldCat, setNewFieldCat] = useState<FieldCategory>('custom');
  const [newFieldAliases, setNewFieldAliases] = useState<string>('');
  const [newFieldSensitive, setNewFieldSensitive] = useState<boolean>(false);
  const [rememberMapping, setRememberMapping] = useState<boolean>(true);

  const toggleFieldEnabled = (index: number) => {
    setMatches((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], enabled: !copy[index].enabled };
      return copy;
    });
  };

  const handleValueChange = (index: number, val: string) => {
    setMatches((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], assignedValue: val };
      return copy;
    });
  };

  const handleFieldRemap = (index: number, newFieldKey: string) => {
    setMatches((prev) => {
      const copy = [...prev];
      const targetProfField = activeProfile.fields[newFieldKey];
      const isSens = Boolean(targetProfField?.isSensitive);
      copy[index] = {
        ...copy[index],
        selectedFieldKey: newFieldKey,
        assignedValue: targetProfField ? targetProfField.value : '',
        confidence: 0.95,
        confidenceTier: 'high',
        matchReason: 'Manually selected by user',
        isSensitive: isSens,
        requiresExplicitOptIn: isSens,
        enabled: !isSens && Boolean(targetProfField && targetProfField.value.trim().length > 0)
      };
      return copy;
    });
  };

  const openCreateFieldModal = (index: number) => {
    const item = matches[index];
    setTargetItemIndex(index);
    setNewFieldName(item.detectedField.label);
    setNewFieldValue(item.assignedValue || '');
    setNewFieldCat('custom');
    setNewFieldAliases(item.detectedField.label);
    setNewFieldSensitive(false);
    setRememberMapping(true);
  };

  const handleSaveDynamicCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetItemIndex === null || !newFieldName.trim()) return;

    const aliases = newFieldAliases
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    try {
      const createdField = await addCustomField(activeProfile.id, {
        name: newFieldName.trim(),
        value: newFieldValue.trim(),
        category: newFieldCat,
        aliases,
        isSensitive: newFieldSensitive
      });

      if (rememberMapping) {
        await saveLearnedMapping(matches[targetItemIndex].detectedField.label, createdField.key);
      }

      // Update the match in preview state
      setMatches((prev) => {
        const copy = [...prev];
        copy[targetItemIndex] = {
          ...copy[targetItemIndex],
          selectedFieldKey: createdField.key,
          assignedValue: createdField.value,
          confidence: 0.98,
          confidenceTier: 'high',
          matchReason: `Newly created profile field: "${createdField.label}"`,
          isSensitive: createdField.isSensitive,
          requiresExplicitOptIn: createdField.isSensitive,
          enabled: !createdField.isSensitive && Boolean(createdField.value.trim().length > 0)
        };
        return copy;
      });

      setTargetItemIndex(null);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      console.error('Failed to create custom field:', err);
    }
  };

  const handleExecuteFill = async () => {
    setIsFilling(true);

    // Save remembered mappings
    for (const item of matches) {
      if (item.isRememberChoice && item.selectedFieldKey) {
        try {
          await saveLearnedMapping(item.detectedField.label, item.selectedFieldKey);
        } catch (err) {
          console.error('Failed to save learned mapping:', err);
        }
      }
    }

    const result = await onFill(matches);
    setIsFilling(false);
    if (result) {
      setVerificationResult(result);
    } else {
      setVerificationResult({
        totalAttempted: enabledCount,
        successCount: enabledCount,
        failedCount: 0,
        failedFields: []
      });
    }
  };

  const enabledCount = matches.filter((m) => m.enabled && m.assignedValue.trim().length > 0).length;

  return (
    <div className="preview-overlay">
      <div className="preview-modal">
        {/* Modal Header */}
        <div className="preview-header">
          <div>
            <div className="preview-title-row">
              <Sparkles size={16} color="#4f46e5" />
              <h3 className="preview-title">Form Preview & Verification</h3>
              <span className="page-type-pill">{formatPageType(scanResult.pageType)}</span>
            </div>
            <p className="preview-subtitle">
              Review, opt in to sensitive data, and verify values before filling. Never auto-submits.
            </p>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isFilling}>
            <X size={18} />
          </button>
        </div>

        {/* Post-Fill Verification Banner */}
        {verificationResult && (
          <div
            className={`verification-banner ${
              verificationResult.failedCount > 0 ? 'has-failures' : 'all-passed'
            }`}
          >
            {verificationResult.failedCount === 0 ? (
              <div className="verification-success">
                <CheckCircle2 size={18} color="#10b981" />
                <span>
                  <strong>Post-Fill Verified:</strong> Successfully filled and verified all{' '}
                  {verificationResult.successCount} fields!
                </span>
              </div>
            ) : (
              <div className="verification-failure">
                <AlertCircle size={18} color="#ef4444" />
                <div>
                  <strong>Verification Warning:</strong> {verificationResult.successCount} fields
                  filled, but {verificationResult.failedCount} fields failed verification:
                  <ul className="failed-list">
                    {verificationResult.failedFields.map((f) => (
                      <li key={f.fieldId}>
                        "{f.label}": {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Body - Items List */}
        <div className="preview-list">
          {matches.map((item, idx) => {
            const hasValue = Boolean(item.assignedValue && item.assignedValue.trim().length > 0);
            const isOptInRequired = Boolean(item.isSensitive || item.requiresExplicitOptIn);

            return (
              <div
                key={item.detectedField.id}
                className={`preview-item ${item.enabled ? 'active' : 'disabled'} ${
                  isOptInRequired ? 'sensitive-card' : ''
                }`}
              >
                {/* Sensitive Security Pill */}
                {isOptInRequired && (
                  <div className="sensitive-pill-banner">
                    <ShieldAlert size={13} color="#b45309" />
                    <span>
                      <strong>Sensitive Information:</strong> Explicit opt-in required. Check the
                      box to include.
                    </span>
                  </div>
                )}

                <div className="item-row-top">
                  <label className="checkbox-wrap" title={isOptInRequired ? 'Click to opt in' : 'Toggle fill'}>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      disabled={!hasValue && !isOptInRequired}
                      onChange={() => toggleFieldEnabled(idx)}
                    />
                  </label>

                  <div className="item-status-icon">
                    {item.confidenceTier === 'high' && hasValue ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : item.confidenceTier === 'review' && hasValue ? (
                      <AlertTriangle size={16} color="#f59e0b" />
                    ) : (
                      <HelpCircle size={16} color="#94a3b8" />
                    )}
                  </div>

                  <div className="item-labels">
                    <span className="item-question">
                      {item.detectedField.label}
                      {item.detectedField.required && <span className="req-star">*</span>}
                    </span>
                    {item.detectedField.context && (
                      <span className="item-context">({item.detectedField.context})</span>
                    )}
                  </div>

                  {/* Confidence Tier Tag */}
                  <span className={`confidence-tag tier-${item.confidenceTier}`}>
                    {item.confidenceTier === 'high' && hasValue
                      ? `${Math.round(item.confidence * 100)}% High`
                      : item.confidenceTier === 'review' && hasValue
                      ? 'Review'
                      : item.confidenceTier === 'manual'
                      ? 'Confirm'
                      : 'No Match'}
                  </span>
                </div>

                {/* Remap and Value editing row */}
                <div className="item-row-bottom">
                  <div className="remap-select-wrap">
                    <span className="remap-label">Map to:</span>
                    <select
                      className="remap-select"
                      value={item.selectedFieldKey || ''}
                      onChange={(e) => handleFieldRemap(idx, e.target.value)}
                    >
                      <option value="">-- Choose Profile Field --</option>
                      {Object.values(activeProfile.fields).map((pf) => (
                        <option key={pf.id} value={pf.key}>
                          {pf.label} {pf.isCustom ? '⭐ (Custom)' : ''}{' '}
                          {pf.value ? `(${pf.value.slice(0, 16)})` : '(empty)'}
                        </option>
                      ))}
                    </select>

                    {/* Inline Create Profile Field Button */}
                    <button
                      type="button"
                      className="btn-inline-create"
                      title="Create a new profile field for this question"
                      onClick={() => openCreateFieldModal(idx)}
                    >
                      <Plus size={11} />
                      Create Field
                    </button>
                  </div>

                  <input
                    type={isOptInRequired ? 'password' : 'text'}
                    className="item-value-input"
                    placeholder="Enter value to fill"
                    value={item.assignedValue}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                  />
                </div>

                {/* Match reason and type description */}
                <div className="remember-row">
                  <span className="match-reason">{item.matchReason}</span>
                  {item.detectedField.type === 'combobox' && (
                    <span className="combobox-badge">Custom Combobox</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="preview-footer">
          <div className="footer-status">
            {verificationResult ? (
              <span className="status-success">
                <Check size={16} /> Fill complete • {verificationResult.successCount} fields
                verified
              </span>
            ) : (
              <span>
                <strong>{enabledCount}</strong> of {matches.length} fields will be filled
              </span>
            )}
          </div>

          <div className="footer-actions">
            <button className="btn btn-secondary" onClick={onClose} disabled={isFilling}>
              {verificationResult ? 'Close' : 'Cancel'}
            </button>
            <button
              className="btn btn-primary btn-fill-action"
              disabled={enabledCount === 0 || isFilling}
              onClick={handleExecuteFill}
            >
              {isFilling ? (
                'Filling and verifying...'
              ) : verificationResult ? (
                'Filled & Verified ✓'
              ) : (
                <>
                  Fill {enabledCount} Fields
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Inline Create Profile Field Modal */}
      {targetItemIndex !== null && (
        <div className="modal-overlay" onClick={() => setTargetItemIndex(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Profile Field for this Question</h3>
              <button className="btn-close" onClick={() => setTargetItemIndex(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDynamicCustomField}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Field Name</label>
                  <input
                    type="text"
                    required
                    className="text-input"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="e.g. GitHub URL, Preferred Location"
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Value</label>
                  <input
                    type="text"
                    required
                    className="text-input"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Enter value"
                    autoFocus
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Category</label>
                  <select
                    className="text-input"
                    value={newFieldCat}
                    onChange={(e) => setNewFieldCat(e.target.value as FieldCategory)}
                  >
                    <option value="custom">Custom</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="job">Job Application</option>
                    <option value="travel">Travel & Flight</option>
                    <option value="education">Education</option>
                    <option value="contact">Contact</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Matching Aliases (Comma-separated)</label>
                  <input
                    type="text"
                    className="text-input"
                    value={newFieldAliases}
                    onChange={(e) => setNewFieldAliases(e.target.value)}
                    placeholder="e.g. GitHub profile, GitHub URL, GitHub link"
                  />
                </div>

                <div className="field-group">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={newFieldSensitive}
                      onChange={(e) => setNewFieldSensitive(e.target.checked)}
                    />
                    Mark as sensitive (requires explicit opt-in before filling)
                  </label>
                </div>

                <div className="field-group">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMapping}
                      onChange={(e) => setRememberMapping(e.target.checked)}
                    />
                    Remember this field mapping for future forms
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setTargetItemIndex(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-add-field">
                  Save & Map Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function formatPageType(type: FormScanResult['pageType']): string {
  switch (type) {
    case 'google_form':
      return 'Google Form';
    case 'job_application':
      return 'Job Application';
    case 'flight_booking':
      return 'Flight / Travel';
    default:
      return 'Web Form';
  }
}
