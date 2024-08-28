CREATE TABLE companies (
  handle VARCHAR(25) PRIMARY KEY CHECK (handle = lower(handle)),
  name TEXT UNIQUE NOT NULL,
  num_employees INTEGER CHECK (num_employees >= 0),
  description TEXT NOT NULL,
  logo_url TEXT -- Added constraint for size, if needed, e.g., VARCHAR(255)
);

CREATE TABLE users (
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (email ~* '^.+@.+\..+$'), -- Example regex for email validation
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  salary INTEGER CHECK (salary >= 0),
  equity NUMERIC CHECK (equity >= 0.0 AND equity <= 1.0),
  company_handle VARCHAR(25) NOT NULL
    REFERENCES companies(handle) ON DELETE CASCADE
);

CREATE TABLE applications (
  username VARCHAR(25) NOT NULL
    REFERENCES users(username) ON DELETE CASCADE,
  job_id INTEGER NOT NULL
    REFERENCES jobs(id) ON DELETE CASCADE,
  PRIMARY KEY (username, job_id)
);

