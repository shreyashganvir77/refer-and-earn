import React from 'react';

const CompanyCard = ({ company, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200
        ${isSelected 
          ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-105' 
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
        }
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-lg object-contain bg-gray-50 p-2"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=6366f1&color=fff&size=64`;
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{company.description}</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
