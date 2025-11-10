import React from 'react';
import useTypes from '../hooks/useTypes';

/**
 * TypeSelect Component
 * A dropdown select component that automatically loads and displays types from GlobalTypeMaster
 * Replaces all hardcoded enum dropdowns
 * 
 * @param {string} group - Type group name (e.g., 'UserRole', 'AssetStatus')
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {string} name - Input name attribute
 * @param {boolean} required - Whether field is required
 * @param {boolean} disabled - Whether field is disabled
 * @param {string} className - Additional CSS classes
 * @param {string} placeholder - Placeholder text
 * @param {boolean} includeEmpty - Include empty option (default: true)
 * @param {string} emptyLabel - Label for empty option (default: "Select...")
 * 
 * @example
 * <TypeSelect
 *   group="UserRole"
 *   value={formData.role}
 *   onChange={(e) => setFormData({...formData, role: e.target.value})}
 *   name="role"
 *   required
 * />
 */
const TypeSelect = ({
  group,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select...',
  includeEmpty = true,
  emptyLabel = 'Select...',
  ...props
}) => {
  const { types, loading, error } = useTypes(group);

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Error loading {group}: {error}
      </div>
    );
  }

  return (
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      disabled={disabled || loading}
      className={`form-select ${className} ${loading ? 'opacity-50' : ''}`}
      {...props}
    >
      {includeEmpty && (
        <option value="">
          {loading ? 'Loading...' : emptyLabel}
        </option>
      )}
      {types.map((type) => (
        <option key={type.key} value={type.key}>
          {type.label}
        </option>
      ))}
    </select>
  );
};

export default TypeSelect;
