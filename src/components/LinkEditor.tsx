import React, { useState } from 'react';

interface LinkEditorProps {
  links: string[];
  onLinksChange: (links: string[]) => void;
  editable: boolean;
}

// URL validation function
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const LinkEditor: React.FC<LinkEditorProps> = ({ links, onLinksChange, editable }) => {
  const [newLink, setNewLink] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');

  const handleAddLink = () => {
    const trimmedLink = newLink.trim();

    if (!trimmedLink) {
      setError('Link cannot be empty');
      return;
    }

    if (!isValidUrl(trimmedLink)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    onLinksChange([...links, trimmedLink]);
    setNewLink('');
    setError('');
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    onLinksChange(newLinks);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(links[index]);
    setError('');
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const trimmedLink = editingValue.trim();

    if (!trimmedLink) {
      setError('Link cannot be empty');
      return;
    }

    if (!isValidUrl(trimmedLink)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    const newLinks = [...links];
    newLinks[editingIndex] = trimmedLink;
    onLinksChange(newLinks);
    setEditingIndex(null);
    setEditingValue('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'add') {
        handleAddLink();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape') {
      if (action === 'add') {
        setNewLink('');
        setError('');
      } else {
        handleCancelEdit();
      }
    }
  };

  if (!editable && (!links || links.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-zinc-300">Links</h4>

      {/* List of existing links */}
      {links && links.length > 0 && (
        <div className="space-y-1.5">
          {links.map((link, index) => (
            <div key={index} className="flex items-start gap-2">
              {editable && editingIndex === index ? (
                <div className="flex-1 space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'edit')}
                      placeholder="https://example.com"
                      autoFocus
                      className="flex-1 text-xs bg-zinc-800 text-zinc-100 px-2 py-1.5 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                </div>
              ) : (
                <>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-blue-400 hover:text-blue-300 underline break-all"
                  >
                    {link}
                  </a>
                  {editable && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStartEdit(index);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-300 px-1.5"
                        title="Edit link"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveLink(index);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 px-1.5"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new link */}
      {editable && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              type="url"
              value={newLink}
              onChange={(e) => {
                setNewLink(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => handleKeyDown(e, 'add')}
              placeholder="https://example.com"
              className="flex-1 text-xs bg-zinc-800 text-zinc-100 px-2 py-1.5 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleAddLink}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
              title="Add link"
            >
              + Add
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
};
