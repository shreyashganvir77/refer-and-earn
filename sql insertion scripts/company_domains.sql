INSERT INTO dbo.company_domains (company_id, domain)
SELECT c.company_id, v.domain
FROM dbo.companies c
JOIN (VALUES
    ('Adobe', 'adobe.com'),
    ('Amazon', 'amazon.com'),
    ('Apple', 'apple.com'),
    ('Google', 'google.com'),
    ('Meta', 'meta.com'),
    ('Meta', 'fb.com'),
    ('Microsoft', 'microsoft.com'),
    ('Microsoft', 'email.microsoft.com'),
    ('Netflix', 'netflix.com'),
    ('Optum', 'optum.com'),
    ('Salesforce', 'salesforce.com'),
    ('Uber', 'uber.com'),
    ('Cognizant', 'cognizant.com'),
    ('HCL Technologies', 'hcltech.com'),
    ('ICICI Bank', 'icicibank.com'),
    ('TCS', 'tcs.com'),
    ('Infosys', 'infosys.com'),
    ('PhonePe', 'phonepe.com'),
    ('Flipkart', 'flipkart.com'),
    ('Deloitte', 'deloitte.com'),
    ('ZS Associates', 'zs.com'),
    ('Walmart', 'walmart.com'),
    ('Persistent Systems', 'persistent.com'),
    ('Rippling', 'rippling.com'),
    ('JPMorgan Chase', 'jpmorgan.com'),
    ('Qualcomm', 'qualcomm.com'),
    ('Morgan Stanley', 'morganstanley.com'),
    ('Uplers', 'uplers.com'),
    ('Meesho', 'meesho.com'),
    ('o9 Solutions', 'o9solutions.com'),
    ('Oracle', 'oracle.com'),
    ('Dell', 'dell.com'),
    ('HP', 'hp.com'),
    ('IBM', 'ibm.com'),
    ('Tech Mahindra', 'techmahindra.com')
) v(company_name, domain)
    ON c.company_name = v.company_name
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.company_domains d
    WHERE d.company_id = c.company_id
      AND d.domain = v.domain
);
