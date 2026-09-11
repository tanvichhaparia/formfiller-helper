import React, { useEffect, useState, useTransition } from 'react';
import {
  FileText,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Globe,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Layers,
  Plane,
  X
} from 'lucide-react';
import {
  getStorageState,
  setActiveProfile,
  updateFieldValue,
  addCustomField,
  deleteCustomField,
  createProfile,
  deleteProfile,
  subscribeToStorageChanges
} from '../profile/profileStore';
import { PREDEFINED_FIELDS, CATEGORY_METADATA } from '../profile/defaultFields';
import { StorageSchema, Profile, FieldCategory } from '../shared/types';
import './options.css';

const CATEGORY_ICONS: Record<FieldCategory, React.ReactNode> = {
  personal: <User size={16} />,
  contact: <Phone size={16} />,
  address: <MapPin size={16} />,
  education: <GraduationCap size={16} />,
  work: <Briefcase size={16} />,
  online: <Globe size={16} />,
  travel: <Plane size={16} />,
  job: <Briefcase size={16} />,
  custom: <Sparkles size={16} />
};

export const App: React.FC = () => {
  const [storageState, setStorageState] = useState<StorageSchema | null>(null);
  const [activeCategory, setActiveCategory] = useState<FieldCategory>('personal');
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [showNewProfileModal, setShowNewProfileModal] = useState<boolean>(false);

  // Custom field form state
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [customFieldCat, setCustomFieldCat] = useState<FieldCategory>('custom');
  const [customFieldAliases, setCustomFieldAliases] = useState('');
  const [customFieldDesc, setCustomFieldDesc] = useState('');
  const [customFieldSensitive, setCustomFieldSensitive] = useState(false);

  // New profile form state
  const [newProfileName, setNewProfileName] = useState('');

  const [, startTransition] = useTransition();

  useEffect(() => {
    getStorageState().then((state) => {
      setStorageState(state);
    });

    const unsubscribe = subscribeToStorageChanges((newState) => {
      setStorageState(newState);
    });

    return () => unsubscribe();
  }, []);

  if (!storageState) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Loading FormFill Helper settings...
      </div>
    );
  }

  const activeProfile: Profile = storageState.profiles[storageState.activeProfileId] ||
    Object.values(storageState.profiles)[0];

  const handleProfileSwitch = async (profileId: string) => {
    await setActiveProfile(profileId);
    setSaveStatus('Profile switched');
    setTimeout(() => setSaveStatus('Saved'), 1500);
  };

  const handleFieldChange = async (fieldKey: string, value: string) => {
    setSaveStatus('Saving...');
    // Optimistically update local React state
    startTransition(() => {
      setStorageState((prev) => {
        if (!prev) return prev;
        const currentProf = prev.profiles[prev.activeProfileId];
        if (!currentProf) return prev;
        const updatedFields = {
          ...currentProf.fields,
          [fieldKey]: {
            ...currentProf.fields[fieldKey],
            value
          }
        };
        return {
          ...prev,
          profiles: {
            ...prev.profiles,
            [prev.activeProfileId]: {
              ...currentProf,
              fields: updatedFields
            }
          }
        };
      });
    });

    await updateFieldValue(activeProfile.id, fieldKey, value);
    setSaveStatus('Saved locally');
    setTimeout(() => setSaveStatus('Saved'), 2000);
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldName.trim()) return;

    const aliases = customFieldAliases
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    await addCustomField(activeProfile.id, {
      name: customFieldName.trim(),
      value: customFieldValue.trim(),
      category: customFieldCat,
      aliases,
      description: customFieldDesc.trim() || undefined,
      isSensitive: customFieldSensitive
    });

    setCustomFieldName('');
    setCustomFieldValue('');
    setCustomFieldAliases('');
    setCustomFieldDesc('');
    setCustomFieldSensitive(false);
    setShowAddCustomModal(false);
    setSaveStatus('Custom field added');
    setTimeout(() => setSaveStatus('Saved'), 1500);
  };

  const handleDeleteCustomField = async (fieldId: string) => {
    if (confirm('Delete this custom field?')) {
      await deleteCustomField(activeProfile.id, fieldId);
      setSaveStatus('Custom field deleted');
      setTimeout(() => setSaveStatus('Saved'), 1500);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    await createProfile(newProfileName.trim(), 'custom');
    setNewProfileName('');
    setShowNewProfileModal(false);
    setSaveStatus('Profile created');
    setTimeout(() => setSaveStatus('Saved'), 1500);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (Object.keys(storageState.profiles).length <= 1) {
      alert('You must keep at least one profile.');
      return;
    }
    if (confirm(`Are you sure you want to delete profile "${storageState.profiles[profileId]?.name}"?`)) {
      await deleteProfile(profileId);
      setSaveStatus('Profile deleted');
      setTimeout(() => setSaveStatus('Saved'), 1500);
    }
  };

  // Group fields
  const currentPredefinedFields = PREDEFINED_FIELDS.filter((f) => f.category === activeCategory);
  const customFieldsForProfile = Object.values(activeProfile.fields).filter((f) => f.isCustom);

  // Category counts
  const categoryCounts: Record<FieldCategory, { filled: number; total: number }> = {
    personal: { filled: 0, total: 0 },
    contact: { filled: 0, total: 0 },
    address: { filled: 0, total: 0 },
    education: { filled: 0, total: 0 },
    work: { filled: 0, total: 0 },
    online: { filled: 0, total: 0 },
    travel: { filled: 0, total: 0 },
    job: { filled: 0, total: 0 },
    custom: { filled: 0, total: 0 }
  };

  Object.values(activeProfile.fields).forEach((f) => {
    const cat = f.category;
    if (categoryCounts[cat]) {
      categoryCounts[cat].total++;
      if (f.value && f.value.trim().length > 0) {
        categoryCounts[cat].filled++;
      }
    }
  });

  return (
    <div className="options-layout">
      {/* Top Bar */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="nav-brand">
            <div className="nav-logo-icon">
              <FileText size={20} />
            </div>
            <div>
              <div className="nav-title">FormFill Helper</div>
              <div className="nav-tagline">Personal Form-Filling Profile Manager</div>
            </div>
          </div>
          <div className="saved-pill">
            <Check size={14} />
            <span>{saveStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-container">
        {/* Profile Switcher Tabs */}
        <div className="profile-bar">
          <div className="profile-tabs">
            {Object.values(storageState.profiles).map((prof) => (
              <button
                key={prof.id}
                className={`profile-tab ${prof.id === activeProfile.id ? 'active' : ''}`}
                onClick={() => handleProfileSwitch(prof.id)}
              >
                <Layers size={14} />
                <span>{prof.name}</span>
                {prof.id === activeProfile.id && (
                  <span className="profile-badge">Active</span>
                )}
              </button>
            ))}
            <button
              className="btn-new-profile"
              onClick={() => setShowNewProfileModal(true)}
            >
              <Plus size={14} />
              New Profile
            </button>
          </div>

          {Object.keys(storageState.profiles).length > 1 && (
            <button
              className="btn-icon-danger"
              title={`Delete ${activeProfile.name} profile`}
              onClick={() => handleDeleteProfile(activeProfile.id)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Sidebar */}
          <aside className="category-sidebar">
            <div className="sidebar-heading">Categories</div>
            {(
              [
                'personal',
                'contact',
                'address',
                'education',
                'work',
                'online',
                'travel',
                'job',
                'custom'
              ] as FieldCategory[]
            ).map((cat) => {
              const info = CATEGORY_METADATA[cat];
              const counts = categoryCounts[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  className={`category-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {CATEGORY_ICONS[cat]}
                    <span>{info.label}</span>
                  </div>
                  <span className="cat-count">
                    {counts.filled} / {counts.total}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* Section Detail Card */}
          <section className="field-section-card">
            <div className="section-header">
              <div>
                <h2 className="section-title">{CATEGORY_METADATA[activeCategory].label}</h2>
                <p className="section-desc">{CATEGORY_METADATA[activeCategory].description}</p>
              </div>
              {activeCategory === 'custom' && (
                <button
                  className="btn-add-field"
                  onClick={() => setShowAddCustomModal(true)}
                >
                  <Plus size={15} />
                  Add Custom Field
                </button>
              )}
            </div>

            {/* Standard Category Fields */}
            {activeCategory !== 'custom' && (
              <div className="fields-grid">
                {currentPredefinedFields.map((fieldDef) => {
                  const field = activeProfile.fields[fieldDef.key] || {
                    id: fieldDef.key,
                    key: fieldDef.key,
                    label: fieldDef.label,
                    value: '',
                    category: fieldDef.category,
                    enabled: true
                  };

                  const isFullWidth =
                    fieldDef.key.includes('address') ||
                    fieldDef.key === 'website' ||
                    fieldDef.key === 'linkedin' ||
                    fieldDef.key === 'github' ||
                    fieldDef.key === 'portfolio';

                  return (
                    <div
                      key={fieldDef.key}
                      className={`field-group ${isFullWidth ? 'full-width' : ''}`}
                    >
                      <div className="field-label-row">
                        <label className="field-label">{fieldDef.label}</label>
                        <span className="field-tag">Optional</span>
                      </div>
                      <div className="input-wrapper">
                        <input
                          type={fieldDef.type || 'text'}
                          className="text-input"
                          placeholder={fieldDef.placeholder || `Enter ${fieldDef.label}`}
                          value={field.value || ''}
                          onChange={(e) => handleFieldChange(fieldDef.key, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Category Fields */}
            {activeCategory === 'custom' && (
              <div>
                {customFieldsForProfile.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Sparkles size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
                    <p style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
                      No custom fields added yet
                    </p>
                    <p style={{ fontSize: 13, marginTop: 4, maxWidth: 360, margin: '6px auto 16px' }}>
                      Add arbitrary personal or business fields such as Employee ID, Blood Group,
                      or Tax Number.
                    </p>
                    <button
                      className="btn-add-field"
                      style={{ margin: '0 auto' }}
                      onClick={() => setShowAddCustomModal(true)}
                    >
                      <Plus size={15} />
                      Create your first custom field
                    </button>
                  </div>
                ) : (
                  <div>
                    {customFieldsForProfile.map((field) => (
                      <div key={field.id} className="custom-field-item">
                        <div className="cf-info">
                          <div className="cf-name">
                            <span>{field.label}</span>
                            <span className="cf-cat-badge">{field.category}</span>
                            <span className="cf-cat-badge" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>User Custom Field</span>
                            {field.isSensitive && (
                              <span className="cf-cat-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Sensitive Opt-In</span>
                            )}
                            {field.aliases && field.aliases.length > 0 && (
                              <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                                (Aliases: {field.aliases.join(', ')})
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            className="text-input cf-value-input"
                            placeholder="Enter value"
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          />
                        </div>
                        <div className="cf-actions">
                          <button
                            className="btn-icon-danger"
                            title="Delete custom field"
                            onClick={() => handleDeleteCustomField(field.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Privacy Guarantee Box */}
            <div className="privacy-banner">
              <ShieldCheck size={20} color="#166534" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="privacy-title">Local Browser Storage Privacy</div>
                <div className="privacy-text">
                  Your profile data is stored locally in your browser. FormFill Helper does not send
                  your saved profile information to a server.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Add Custom Field Modal */}
      {showAddCustomModal && (
        <div className="modal-overlay" onClick={() => setShowAddCustomModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Custom Field</h3>
              <button
                className="btn-icon-danger"
                onClick={() => setShowAddCustomModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomField}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Field Name</label>
                  <input
                    type="text"
                    required
                    className="text-input"
                    placeholder="e.g. Employee ID, Blood Group, Business Name"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Initial Value</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g. EMP1024, O+, ABC Traders"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Category</label>
                  <select
                    className="text-input"
                    value={customFieldCat}
                    onChange={(e) => setCustomFieldCat(e.target.value as FieldCategory)}
                  >
                    <option value="custom">Custom</option>
                    <option value="personal">Personal</option>
                    <option value="contact">Contact</option>
                    <option value="education">Education</option>
                    <option value="work">Work</option>
                    <option value="travel">Travel & Flight</option>
                    <option value="job">Job Application</option>
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Matching Aliases / Keywords (Comma-separated)</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g. GitHub URL, GitHub profile, GitHub repo"
                    value={customFieldAliases}
                    onChange={(e) => setCustomFieldAliases(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Description / Notes (Optional)</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Brief description of this field"
                    value={customFieldDesc}
                    onChange={(e) => setCustomFieldDesc(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="remember-label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={customFieldSensitive}
                      onChange={(e) => setCustomFieldSensitive(e.target.checked)}
                    />
                    <span>Mark as sensitive (requires explicit opt-in before filling)</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-add-field">
                  Save Custom Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Profile Modal */}
      {showNewProfileModal && (
        <div className="modal-overlay" onClick={() => setShowNewProfileModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Profile</h3>
              <button
                className="btn-icon-danger"
                onClick={() => setShowNewProfileModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProfile}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Profile Name</label>
                  <input
                    type="text"
                    required
                    className="text-input"
                    placeholder="e.g. Freelance, Secondary Work, Research"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowNewProfileModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-add-field">
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
