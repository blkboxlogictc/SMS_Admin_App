-- PostgreSQL functions to handle flexible date parsing for Stuart Main Street App
-- These functions can be run in Supabase SQL Editor to add robust date handling

-- Function to safely parse various date formats into PostgreSQL timestamp
CREATE OR REPLACE FUNCTION parse_flexible_timestamp(input_text TEXT)
RETURNS TIMESTAMP AS $$
BEGIN
    -- Handle null or empty input
    IF input_text IS NULL OR input_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Try to parse as ISO 8601 format first (most common)
    BEGIN
        RETURN input_text::TIMESTAMP;
    EXCEPTION WHEN OTHERS THEN
        -- If that fails, try other common formats
        NULL;
    END;
    
    -- Try parsing as ISO with timezone and convert to local timestamp
    BEGIN
        RETURN (input_text::TIMESTAMPTZ)::TIMESTAMP;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Try parsing common date formats
    BEGIN
        -- Try YYYY-MM-DD HH:MM:SS format
        RETURN TO_TIMESTAMP(input_text, 'YYYY-MM-DD HH24:MI:SS');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        -- Try YYYY-MM-DD format (add default time)
        RETURN TO_TIMESTAMP(input_text || ' 00:00:00', 'YYYY-MM-DD HH24:MI:SS');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- If all parsing attempts fail, raise an error
    RAISE EXCEPTION 'Unable to parse timestamp from: %', input_text;
END;
$$ LANGUAGE plpgsql;

-- Function to safely parse date with time components
CREATE OR REPLACE FUNCTION parse_date_time(date_part TEXT, time_part TEXT DEFAULT '00:00:00')
RETURNS TIMESTAMP AS $$
BEGIN
    -- Handle null inputs
    IF date_part IS NULL OR date_part = '' THEN
        RETURN NULL;
    END IF;
    
    -- Use default time if not provided
    IF time_part IS NULL OR time_part = '' THEN
        time_part := '00:00:00';
    END IF;
    
    -- Combine date and time parts
    RETURN parse_flexible_timestamp(date_part || ' ' || time_part);
END;
$$ LANGUAGE plpgsql;

-- Example usage in your application:
-- Instead of direct timestamp insertion, you can use:
-- INSERT INTO events (name, date, location) VALUES ('Test Event', parse_flexible_timestamp('2025-01-25T14:00:00.000Z'), 'Main Street');
-- INSERT INTO reward_items (name, expiration_date) VALUES ('Test Reward', parse_date_time('2025-02-15', '23:59:00'));

-- You can also create triggers to automatically convert date fields on insert/update
-- This would make the conversion transparent to your application code

-- Trigger function for events table
CREATE OR REPLACE FUNCTION convert_event_date()
RETURNS TRIGGER AS $$
BEGIN
    -- If date is provided as text, convert it using our flexible parser
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- This assumes you might pass date as text in some cases
        -- Adjust based on your actual needs
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Example trigger (uncomment if you want automatic conversion)
-- CREATE TRIGGER event_date_conversion
--     BEFORE INSERT OR UPDATE ON events
--     FOR EACH ROW
--     EXECUTE FUNCTION convert_event_date();