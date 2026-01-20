import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyCard from '../components/CompanyCard';
import ProviderCard from '../components/ProviderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

const WantReferral = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [providers, setProviders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadCompanies() {
      try {
        const data = await api.companies();
        if (!mounted) return;
        setCompanies(data.companies || []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load companies');
      } finally {
        if (mounted) setLoadingCompanies(false);
      }
    }
    loadCompanies();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCompanySelect = async (company) => {
    setSelectedCompany(company);
    setLoading(true);
    setShowProviders(false);
    setError(null);

    try {
      const data = await api.providersByCompany(company.company_id || company.id);
      setProviders(data.providers || []);
      setShowProviders(true);

      setTimeout(() => {
        document.getElementById('providers-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      setError(e.message || 'Failed to load providers');
      setProviders([]);
      setShowProviders(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReferral = (provider) => {
    // Basic request flow (no payments yet)
    const companyId = selectedCompany?.company_id;
    const providerUserId = provider.user_id;
    const price = provider.price_per_referral;

    if (!companyId || !providerUserId) return;

    api.createReferral({
      provider_user_id: providerUserId,
      company_id: companyId,
      price_agreed: price ?? 0,
    })
      .then(() => alert('Referral request created (pending).'))
      .catch((e) => alert(e.message || 'Failed to create referral request'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Home
            </button>
            <h1 className="text-xl font-bold text-gray-900">Want a Referral</h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Selection Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Company</h2>
          {loadingCompanies ? (
            <LoadingSpinner message="Loading companies..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {companies.map((company) => (
                <CompanyCard
                  key={company.company_id || company.id}
                  company={{
                    id: company.company_id ?? company.id,
                    name: company.company_name ?? company.name,
                    logo: company.logo_url ?? company.logo,
                    description: company.industry ?? company.description ?? '',
                  }}
                  isSelected={String(selectedCompany?.company_id) === String(company.company_id)}
                  onClick={() => handleCompanySelect(company)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mb-12">
            <LoadingSpinner message="Loading referral providers..." />
          </div>
        )}

        {/* Providers Section */}
        {showProviders && !loading && (
          <div id="providers-section" className="mb-12">
            {selectedCompany && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Referral Providers at {selectedCompany.company_name || selectedCompany.name}
                </h2>
                <p className="text-gray-600">
                  Choose a provider to request a referral
                </p>
              </div>
            )}

            {error && (
              <div className="bg-white rounded-lg p-4 mb-6 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {providers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.user_id || provider.id}
                    provider={{
                      id: provider.user_id ?? provider.id,
                      user_id: provider.user_id ?? provider.id,
                      name: provider.full_name ?? provider.name,
                      role: provider.role_designation ?? provider.role,
                      rating: provider.provider_rating ?? provider.rating ?? 0,
                      price: provider.price_per_referral ?? provider.price ?? 0,
                      price_per_referral: provider.price_per_referral ?? provider.price ?? 0,
                      description: provider.bio_description ?? provider.description ?? '',
                    }}
                    onRequestReferral={handleRequestReferral}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-600">No referral providers available for this company yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedCompany && !loading && (
          <div className="bg-white rounded-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 text-lg">Select a company above to see available referral providers</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WantReferral;
