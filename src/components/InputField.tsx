import React from "react";

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: string;
  formattedValue?: string;
  wordValue?: string;
  readOnly?: boolean;
  isCalculated?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  step,
  formattedValue,
  wordValue,
  readOnly = false,
  isCalculated = false,
}) => {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="block text-gray-300 text-sm font-medium mb-2"
      >
        {label}
      </label>
      <div className="relative">
        {isCalculated ? (
          <div
            className="
            w-full
            h-14
            px-4
            py-4
            bg-gray-700
            text-white
            text-base
            font-semibold
            border
            border-gray-600
            rounded-lg
            flex
            items-center
          "
          >
            {value}
          </div>
        ) : (
          <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            readOnly={readOnly}
            className="
              w-full
              h-14
              px-4
              py-4
              bg-gray-700
              text-white
              text-base
              border
              border-gray-600
              rounded-lg
              transition-all
              duration-200
              ease-in-out
              focus:outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-500
              focus:ring-opacity-50
              hover:border-gray-500
              disabled:opacity-50
              disabled:cursor-not-allowed
              placeholder-gray-500
            "
          />
        )}
        {formattedValue && (
          <div className="mt-2 text-sm text-gray-400">
            <span className="font-medium">{formattedValue}</span>
            {wordValue && (
              <span className="ml-1 text-gray-500">({wordValue})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
