import { FormScanResult, FormPageType } from '../shared/types';
import { isGoogleFormsPage, detectGoogleFormsQuestions } from './googleFormsDetector';
import { detectGenericFormFields, detectPageType } from './genericFormDetector';

/**
 * Universal form scanner that unifies Google Forms and generic web forms (jobs, flights, e-commerce).
 */
export function scanPageForms(): FormScanResult {
  const isGForm = isGoogleFormsPage();
  const pageType: FormPageType = isGForm ? 'google_form' : detectPageType();

  const fields = isGForm
    ? detectGoogleFormsQuestions()
    : detectGenericFormFields();

  return {
    isFormDetected: fields.length > 0,
    pageType,
    title: document.title || 'Form',
    fields
  };
}
