// Mock data for referral providers by company
export const referralProviders = {
  1: [ // Google
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Senior Software Engineer',
      rating: 4.8,
      price: 150,
      description: '5+ years at Google, specializes in backend systems. Successfully referred 12 candidates.',
      companyId: 1
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Product Manager',
      rating: 4.9,
      price: 200,
      description: '8 years experience, expert in product strategy. High success rate with referrals.',
      companyId: 1
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Engineering Manager',
      rating: 4.7,
      price: 180,
      description: 'Manages a team of 15 engineers. Great at matching candidates to roles.',
      companyId: 1
    }
  ],
  2: [ // Microsoft
    {
      id: 4,
      name: 'David Kim',
      role: 'Principal Software Engineer',
      rating: 4.9,
      price: 175,
      description: '10+ years at Microsoft, Azure cloud expert. Referred 20+ successful candidates.',
      companyId: 2
    },
    {
      id: 5,
      name: 'Lisa Wang',
      role: 'Senior Program Manager',
      rating: 4.6,
      price: 160,
      description: 'Expert in cross-functional collaboration. Strong track record with referrals.',
      companyId: 2
    }
  ],
  3: [ // Amazon
    {
      id: 6,
      name: 'James Wilson',
      role: 'Senior SDE',
      rating: 4.7,
      price: 140,
      description: '7 years at Amazon, AWS services specialist. Active in hiring process.',
      companyId: 3
    },
    {
      id: 7,
      name: 'Maria Garcia',
      role: 'Technical Program Manager',
      rating: 4.8,
      price: 155,
      description: 'Manages large-scale projects. Excellent at identifying top talent.',
      companyId: 3
    }
  ],
  4: [ // Meta
    {
      id: 8,
      name: 'Alex Thompson',
      role: 'Senior Engineer',
      rating: 4.9,
      price: 190,
      description: 'Works on AR/VR products. Highly connected within Meta engineering teams.',
      companyId: 4
    },
    {
      id: 9,
      name: 'Jessica Lee',
      role: 'Engineering Lead',
      rating: 4.7,
      price: 170,
      description: 'Leads multiple product teams. Great mentor and referral provider.',
      companyId: 4
    }
  ],
  5: [ // Apple
    {
      id: 10,
      name: 'Robert Taylor',
      role: 'Senior iOS Engineer',
      rating: 4.8,
      price: 200,
      description: '10+ years developing iOS apps. Deep knowledge of Apple culture.',
      companyId: 5
    }
  ],
  6: [ // Netflix
    {
      id: 11,
      name: 'Amanda Brown',
      role: 'Senior Engineer',
      rating: 4.6,
      price: 165,
      description: 'Streaming platform expert. Active in engineering hiring.',
      companyId: 6
    }
  ],
  7: [ // Tesla
    {
      id: 12,
      name: 'Chris Martinez',
      role: 'Senior Autopilot Engineer',
      rating: 4.9,
      price: 185,
      description: 'Autonomous driving specialist. Strong referral network.',
      companyId: 7
    }
  ],
  8: [ // Uber
    {
      id: 13,
      name: 'Rachel Green',
      role: 'Senior Backend Engineer',
      rating: 4.7,
      price: 150,
      description: 'Mobility platform expert. Great at matching candidates.',
      companyId: 8
    }
  ]
};

// Helper function to get providers by company ID
export const getProvidersByCompany = (companyId) => {
  return referralProviders[companyId] || [];
};
