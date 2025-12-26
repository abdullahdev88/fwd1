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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <input
        className={`
          appearance-none rounded-md relative block w-full px-3 py-2 border
          ${error ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
          placeholder-gray-500 dark:placeholder-gray-400
          text-gray-900 dark:text-white
          bg-white dark:bg-gray-700
          focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm 
          transition-colors ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default Input
