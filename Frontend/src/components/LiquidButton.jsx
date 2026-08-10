import React from 'react'

// Fallback: simple button used in place of the previous liquid-animated button.
// Keeps styling consistent but removes the liquid animation and CSS dependency.
export default function LiquidButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
