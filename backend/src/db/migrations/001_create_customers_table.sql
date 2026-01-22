-- Create customers table for secure API token storage
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  location_id VARCHAR(50) UNIQUE NOT NULL,
  api_token VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by location_id
CREATE INDEX IF NOT EXISTS idx_location_id ON customers(location_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on row updates
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE
ON customers FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
