import React from 'react';

/**
 * Component to display edit history information
 * Shows who last edited the record and when
 */
export default function EditHistory({ editedBy, lastEditedAt, editedByUser }) {
  if (!editedBy || !lastEditedAt) {
    return null;
  }

  const editorName = editedByUser
    ? `${editedByUser.firstName} ${editedByUser.lastName}`
    : 'Unknown User';

  // Use Intl.DateTimeFormat to avoid extra dependency
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(lastEditedAt));

  return (
    <div className="mt-4 pt-4 border-t border-black/10">
      <div className="flex items-center text-sm text-[#333]">
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
          />
        </svg>
        <span>
          Terakhir diedit oleh <span className="font-medium text-[#111]">{editorName}</span> pada {formattedDate}
        </span>
      </div>
    </div>
  );
}
