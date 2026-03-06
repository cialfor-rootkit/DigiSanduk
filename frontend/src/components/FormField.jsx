import React from 'react';

const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  as = 'input',
  rows = 4,
  name
}) => {
  const InputTag = as === 'textarea' ? 'textarea' : 'input';

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-haze">{label}</span>
      <InputTag
        className="input-field mt-2"
        type={InputTag === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={InputTag === 'textarea' ? rows : undefined}
        name={name}
      />
    </label>
  );
};

export default FormField;
