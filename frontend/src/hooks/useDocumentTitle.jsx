import { useEffect } from "react";

/**
 * Custom hook to update the document title
 * @param {string} title - The page title (will be appended with " – Guidance Counseling System")
 */
export const useDocumentTitle = (title) => {
  const baseTitle = "Guidance Counseling System";
  const fullTitle = title ? `${title} – ${baseTitle}` : baseTitle;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);
};

export default useDocumentTitle;

