CREATE TABLE guests (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    table_name VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_guests_name_lower ON guests (lower(name));
CREATE INDEX idx_guests_table_name_lower ON guests (lower(table_name));
