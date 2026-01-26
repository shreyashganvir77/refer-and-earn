INSERT INTO dbo.companies (company_name, logo_url, industry)
SELECT v.company_name, v.logo_url, v.industry
FROM (VALUES
    ('Adobe', 'https://img.logo.dev/adobe.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Creative & Marketing Software'),
    ('Amazon', 'https://img.logo.dev/amazon.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'E-commerce & Cloud Computing'),
    ('Apple', 'https://img.logo.dev/apple.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Consumer Electronics & Software'),
    ('Google', 'https://img.logo.dev/google.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Internet & Cloud Computing'),
    ('Meta', 'https://img.logo.dev/meta.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Social Media & Technology'),
    ('Microsoft', 'https://img.logo.dev/microsoft.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Software & Cloud Services'),
    ('Netflix', 'https://img.logo.dev/netflix.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Streaming Technology'),
    ('Optum', 'https://img.logo.dev/optum.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Healthcare Technology'),
    ('Salesforce', 'https://img.logo.dev/salesforce.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'CRM & Cloud Software'),
    ('Uber', 'https://img.logo.dev/uber.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Mobility Platform Technology'),
    ('Cognizant', 'https://img.logo.dev/cognizant.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'IT Services'),
    ('HCL Technologies', 'https://img.logo.dev/hcltech.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'IT Services'),
    ('ICICI Bank', 'https://img.logo.dev/icicibank.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Banking & Financial Services'),
    ('TCS', 'https://img.logo.dev/tcs.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'IT Services'),
    ('Infosys', 'https://img.logo.dev/infosys.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'IT Services'),
    ('PhonePe', 'https://img.logo.dev/phonepe.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Fintech'),
    ('Flipkart', 'https://img.logo.dev/flipkart.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'E-commerce'),
    ('Deloitte', 'https://img.logo.dev/deloitte.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Consulting & Professional Services'),
    ('ZS Associates', 'https://img.logo.dev/zs.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Management Consulting'),
    ('Walmart', 'https://img.logo.dev/walmart.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Retail Technology'),
    ('Persistent Systems', 'https://img.logo.dev/persistent.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Software Services'),
    ('Rippling', 'https://img.logo.dev/rippling.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'HR SaaS'),
    ('JPMorgan Chase', 'https://img.logo.dev/jpmorgan.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Financial Services'),
    ('Qualcomm', 'https://img.logo.dev/qualcomm.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Semiconductors'),
    ('Morgan Stanley', 'https://img.logo.dev/morganstanley.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Investment Banking'),
    ('Uplers', 'https://img.logo.dev/uplers.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Digital Services'),
    ('Meesho', 'https://img.logo.dev/meesho.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'E-commerce'),
    ('o9 Solutions', 'https://img.logo.dev/o9solutions.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Enterprise AI & Planning'),
    ('Oracle', 'https://img.logo.dev/oracle.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Enterprise Software'),
    ('Dell', 'https://img.logo.dev/dell.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Computer Hardware'),
    ('HP', 'https://img.logo.dev/hp.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Computer Hardware'),
    ('IBM', 'https://img.logo.dev/ibm.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'Enterprise Technology'),
    ('Tech Mahindra', 'https://img.logo.dev/techmahindra.com?token=pk_ZrIfKfFASX-Yb_IkRRdpfw', 'IT Services')
) v(company_name, logo_url, industry)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.companies c WHERE c.company_name = v.company_name
);


SELECT * from company_domains