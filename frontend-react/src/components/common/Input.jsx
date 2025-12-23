import React from 'react'

const Input = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          appearance-none rounded-md relative block w-full px-3 py-2 border
          ${error ? 'border-red-300' : 'border-gray-300'}
          placeholder-gray-500 text-gray-900
          bg-white
          focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm 
          transition-colors ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Input
