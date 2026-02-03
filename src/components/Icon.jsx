/**
 * Icon Component
 * Unified SVG icon set for consistent, professional appearance
 * 
 * @module components/Icon
 */

/**
 * SVG icon definitions
 * All icons are designed on a 24x24 viewBox for consistency
 */
const icons = {
  /**
   * Sparkles - Used for polish/format actions
   */
  sparkles: (
    <path 
      d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  ),

  /**
   * Compare - Used for diff/compare actions
   */
  compare: (
    <>
      <path 
        d="M16 3H21V8" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 21H3V16" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M21 3L14 10" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M3 21L10 14" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Flow/Visualize - Used for flow diagram visualization
   */
  flow: (
    <>
      <rect 
        x="3" y="3" width="6" height="6" rx="1" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <rect 
        x="15" y="3" width="6" height="6" rx="1" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <rect 
        x="9" y="15" width="6" height="6" rx="1" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <path 
        d="M6 9V12H12M18 9V12H12M12 12V15" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Clipboard - Used for load sample
   */
  clipboard: (
    <>
      <path 
        d="M16 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H8" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <rect 
        x="8" y="2" width="8" height="4" rx="1" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
    </>
  ),

  /**
   * Trash - Used for clear actions
   */
  trash: (
    <>
      <path 
        d="M3 6H5H21" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Settings/Gear - Used for settings dropdowns
   */
  settings: (
    <>
      <circle 
        cx="12" cy="12" r="3" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <path 
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Warning - Used for warnings and alerts
   */
  warning: (
    <>
      <path 
        d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.74C2.86 20.92 3.21 21.01 3.56 21H20.44C20.79 21.01 21.14 20.92 21.44 20.74C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.97 3.15C12.67 2.98 12.34 2.89 12 2.89C11.66 2.89 11.33 2.98 11.03 3.15C10.73 3.32 10.47 3.56 10.29 3.86Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 9V13" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </>
  ),

  /**
   * Wrench - Used for fixes
   */
  wrench: (
    <path 
      d="M14.7 6.3C14.5 6.1 14.2 6 14 6C13.5 6 13 6.2 12.6 6.6L6.6 12.6C6.2 13 6 13.5 6 14C6 14.2 6.1 14.5 6.3 14.7L9.3 17.7C9.5 17.9 9.8 18 10 18C10.5 18 11 17.8 11.4 17.4L17.4 11.4C17.8 11 18 10.5 18 10C18 9.8 17.9 9.5 17.7 9.3L14.7 6.3ZM20.7 3.3C20.3 2.9 19.7 2.9 19.3 3.3L17 5.6L18.4 7L20.7 4.7C21.1 4.3 21.1 3.7 20.7 3.3ZM3.3 20.7C3.7 21.1 4.3 21.1 4.7 20.7L7 18.4L5.6 17L3.3 19.3C2.9 19.7 2.9 20.3 3.3 20.7Z" 
      fill="currentColor"
    />
  ),

  /**
   * Check - Used for success/applied fixes
   */
  check: (
    <path 
      d="M20 6L9 17L4 12" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  ),

  /**
   * X/Close - Used for errors/close
   */
  x: (
    <>
      <path 
        d="M18 6L6 18" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M6 6L18 18" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Download - Used for download actions
   */
  download: (
    <>
      <path 
        d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7 10L12 15L17 10" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 15V3" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Copy - Used for copy to clipboard
   */
  copy: (
    <>
      <rect 
        x="9" y="9" width="13" height="13" rx="2" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <path 
        d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * JSON/Package - Used for JSON mode
   */
  json: (
    <>
      <path 
        d="M8 3H7C5.89543 3 5 3.89543 5 5V8C5 9.10457 4.10457 10 3 10V14C4.10457 14 5 14.8954 5 16V19C5 20.1046 5.89543 21 7 21H8" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M16 3H17C18.1046 3 19 3.89543 19 5V8C19 9.10457 19.8954 10 21 10V14C19.8954 14 19 14.8954 19 16V19C19 20.1046 18.1046 21 17 21H16" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Code/JavaScript - Used for JS mode
   */
  code: (
    <>
      <path 
        d="M16 18L22 12L16 6" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 6L2 12L8 18" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Info - Used for information tooltips
   */
  info: (
    <>
      <circle 
        cx="12" cy="12" r="10" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <path 
        d="M12 16V12" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </>
  ),

  /**
   * Terminal/Development - Used for development mode
   */
  terminal: (
    <>
      <rect 
        x="2" y="4" width="20" height="16" rx="2" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <path 
        d="M6 9L9 12L6 15" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 15H18" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Clipboard/Plan - Used for plan mode
   */
  plan: (
    <>
      <path 
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <rect 
        x="9" y="3" width="6" height="4" rx="1" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
      />
      <path 
        d="M9 12H15" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M9 16H13" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Swap - Used for swap/reverse actions
   */
  swap: (
    <>
      <path 
        d="M7 16L3 12L7 8" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M21 12H3" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <path 
        d="M17 8L21 12L17 16" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Plus - Used for add/create actions
   */
  plus: (
    <>
      <path 
        d="M12 5V19" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M5 12H19" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Chevron Right - Used for expand/collapse
   */
  chevronRight: (
    <path 
      d="M9 6L15 12L9 18" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  ),

  /**
   * Chevron Left - Used for collapse/back
   */
  chevronLeft: (
    <path 
      d="M15 6L9 12L15 18" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  ),

  /**
   * Filter/Sort - Used for filtering and sorting lists
   */
  filter: (
    <>
      <path 
        d="M4 6H20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M7 12H17" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M10 18H14" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Search - Used for search inputs
   */
  search: (
    <>
      <circle 
        cx="11" 
        cy="11" 
        r="7" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        d="M21 21L16.5 16.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Pencil/Edit - Used for notes and editing
   */
  pencil: (
    <>
      <path 
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Brush - Used for sketches and drawing
   */
  brush: (
    <>
      <path 
        d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * File/Document - Used for documents and notes tab
   */
  document: (
    <>
      <path 
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M14 2v6h6" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M16 13H8M16 17H8M10 9H8" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Eraser - Used for eraser tool
   */
  eraser: (
    <>
      <path 
        d="M20 20H7L3 16C2.4 15.4 2.4 14.6 3 14L13 4C13.6 3.4 14.4 3.4 15 4L21 10C21.6 10.6 21.6 11.4 21 12L11 22" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M18 13L11 6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * Text - Used for text tool
   */
  text: (
    <>
      <path 
        d="M4 7V4H20V7" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 4V20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M8 20H16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </>
  ),

  /**
   * List - Used for bullet list in notes
   */
  list: (
    <>
      <path 
        d="M8 6H21" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M8 12H21" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M8 18H21" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </>
  ),

  /**
   * Quote - Used for blockquote in notes
   */
  quote: (
    <>
      <path 
        d="M3 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

  /**
   * Link - Used for hyperlinks in notes
   */
  link: (
    <>
      <path 
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </>
  ),

};

/**
 * Icon component for rendering SVG icons
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Icon name from the icons object
 * @param {number} [props.size=16] - Icon size in pixels
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element|null} SVG icon element or null if icon not found
 */
function Icon({ name, size = 16, className = '' }) {
  const iconContent = icons[name];
  
  if (!iconContent) {
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`icon-svg ${className}`}
      aria-hidden="true"
    >
      {iconContent}
    </svg>
  );
}

export default Icon;
