import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Settings,
  RefreshCw,
  Briefcase,
  Plane,
  FileCheck
} from 'lucide-react';
import {
  getStorageState,
  setActiveProfile,
  subscribeToStorageChanges,
  countFilledFields
} from '../profile/profileStore';
import { matchAllDetectedFields } from '../matching/questionMatcher';
import { FormPreviewModal } from './components/FormPreviewModal';
import { StorageSchema, Profile, FormScanResult, FormFieldMatchItem } from '../shared/types';
import './popup.css';

export const App: React.FC = () => {
  const [storageState, setStorageState] = useState<StorageSchema | null>(null);
  const [scanResult, setScanResult] = useState<FormScanResult | null>(null);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Load profile storage state
    getStorageState().then((state) => {
      setStorageState(state);
      setLoading(false);
    });

    // 2. Subscribe to live storage changes
    const unsubscribe = subscribeToStorageChanges((newState) => {
      setStorageState(newState);
    });

    // 3. Scan active tab
    queryAndScanActiveTab();

    return () => unsubscribe();
  }, []);

  const queryAndScanActiveTab = () => {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
      return;
    }

    setScanning(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        setScanning(false);
        return;
      }

      const tabId = tabs[0].id;
      setActiveTabId(tabId);

      // Send scan message to tab
      chrome.tabs.sendMessage(tabId, { action: 'SCAN_FORM' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // Attempt script injection if tab wasn't ready
          if (chrome.scripting) {
            chrome.scripting
              .executeScript({
                target: { tabId },
                files: ['contentScript.js']
              })
              .then(() => {
                // Retry scan after injection
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, { action: 'SCAN_FORM' }, (retryResp) => {
                    setScanning(false);
                    if (retryResp && retryResp.success) {
                      setScanResult(retryResp.data);
                    }
                  });
                }, 150);
              })
              .catch(() => {
                setScanning(false);
              });
          } else {
            setScanning(false);
          }
        } else {
          setScanning(false);
          setScanResult(response.data);
        }
      });
    });
  };

  const activeProfile: Profile | undefined = storageState
    ? storageState.profiles[storageState.activeProfileId]
    : undefined;

  // Calculate field matching results
  const matches: FormFieldMatchItem[] = useMemo(() => {
    if (!scanResult || !activeProfile || !scanResult.fields.length) return [];
    return matchAllDetectedFields(
      scanResult.fields,
      activeProfile,
      storageState?.learnedMappings || {}
    );
  }, [scanResult, activeProfile, storageState?.learnedMappings]);

  const readyToFillCount = matches.filter(
    (m) => m.enabled && m.assignedValue.trim().length > 0
  ).length;

  const handleProfileChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (storageState && storageState.profiles[newId]) {
      await setActiveProfile(newId);
    }
  };

  const openOptionsPage = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('./options.html', '_blank');
    }
  };

  const handleExecuteFillFromModal = async (finalMatches: FormFieldMatchItem[]) => {
    if (!activeTabId) return;

    return new Promise<any>((resolve) => {
      chrome.tabs.sendMessage(
        activeTabId,
        { action: 'FILL_FORM', matches: finalMatches },
        (res) => {
          if (res && res.success) {
            resolve({
              totalAttempted: res.totalAttempted,
              successCount: res.successCount,
              failedCount: res.failedCount,
              failedFields: res.failedFields || []
            });
          } else {
            resolve(undefined);
          }
        }
      );
    });
  };

  if (loading || !storageState) {
    return (
      <div className="popup-container" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading FormFill Helper...</p>
      </div>
    );
  }

  const { filled, total } = activeProfile
    ? countFilledFields(activeProfile)
    : { filled: 0, total: 0 };
  const customFieldCount = activeProfile
    ? Object.values(activeProfile.fields).filter((f) => f.isCustom).length
    : 0;

  const hasDetectedFields = scanResult && scanResult.fields && scanResult.fields.length > 0;

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <FileText size={16} />
          </div>
          <span className="brand-title">FormFill Helper</span>
        </div>
        <button
          className="btn-close"
          title="Rescan page"
          onClick={queryAndScanActiveTab}
          disabled={scanning}
        >
          <RefreshCw size={13} className={scanning ? 'spin' : ''} />
        </button>
      </header>

      {/* Main Content */}
      <main className="content">
        {/* Status Card */}
        <div className={`status-banner ${hasDetectedFields ? 'detected' : 'idle'}`}>
          <div className="status-indicator-icon">
            {hasDetectedFields ? (
              getPageIcon(scanResult?.pageType)
            ) : (
              <AlertCircle size={20} />
            )}
          </div>
          <div className="status-content">
            <div className="status-title">
              <span>{hasDetectedFields ? 'Form detected ✓' : 'No form detected'}</span>
              {hasDetectedFields && scanResult && (
                <span className="status-tag">{formatPageLabel(scanResult.pageType)}</span>
              )}
            </div>
            <div className="status-sub">
              {scanning
                ? 'Scanning active tab for questions...'
                : hasDetectedFields
                ? `${scanResult?.fields.length} questions found • ${readyToFillCount} matchable`
                : 'Open a job application, flight booking, Google Form, or signup page'}
            </div>
          </div>
        </div>

        {/* Form Fill Action Button */}
        <button
          className="btn btn-primary"
          disabled={!hasDetectedFields || readyToFillCount === 0}
          onClick={() => setShowPreviewModal(true)}
        >
          <Sparkles size={15} />
          {hasDetectedFields && readyToFillCount > 0
            ? `Preview & Fill (${readyToFillCount} fields)`
            : 'Preview & Fill Form'}
        </button>

        {/* Profile Overview Card */}
        <div className="card">
          <div className="profile-row">
            <span className="profile-label">Active Profile</span>
            <select
              className="profile-select"
              value={storageState.activeProfileId}
              onChange={handleProfileChange}
            >
              {Object.values(storageState.profiles).map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">
                {filled}{' '}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'normal',
                    color: 'var(--text-muted)'
                  }}
                >
                  / {total}
                </span>
              </span>
              <span className="stat-label">Saved values</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{customFieldCount}</span>
              <span className="stat-label">Custom fields</span>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={openOptionsPage}>
            <Settings size={14} />
            Manage Profile & Custom Fields
            <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
          </button>
        </div>
      </main>

      {/* Footer / Privacy Guarantee */}
      <footer className="footer">
        <div className="privacy-pill">
          <ShieldCheck size={14} color="#10b981" />
          <span>Local storage only • Zero data sent to servers</span>
        </div>
      </footer>

      {/* Form Preview & Fill Modal */}
      {showPreviewModal && scanResult && activeProfile && (
        <FormPreviewModal
          scanResult={scanResult}
          initialMatches={matches}
          activeProfile={activeProfile}
          onClose={() => setShowPreviewModal(false)}
          onFill={handleExecuteFillFromModal}
          onProfileUpdated={() => getStorageState().then(setStorageState)}
        />
      )}
    </div>
  );
};

function getPageIcon(type?: FormScanResult['pageType']): React.ReactNode {
  switch (type) {
    case 'flight_booking':
      return <Plane size={20} color="#10b981" />;
    case 'job_application':
      return <Briefcase size={20} color="#10b981" />;
    case 'google_form':
      return <FileCheck size={20} color="#10b981" />;
    default:
      return <CheckCircle2 size={20} color="#10b981" />;
  }
}

function formatPageLabel(type: FormScanResult['pageType']): string {
  switch (type) {
    case 'flight_booking':
      return 'Flight Booking';
    case 'job_application':
      return 'Job Application';
    case 'google_form':
      return 'Google Form';
    default:
      return 'Web Form';
  }
}
