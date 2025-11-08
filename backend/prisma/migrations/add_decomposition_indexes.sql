-- Performance optimization indexes for decomposition queries
-- These indexes dramatically improve query performance for the decomposition module

-- Index for faster decomposition plan queries by company and request type
CREATE INDEX IF NOT EXISTS "idx_asset_request_decomposition" 
ON "asset_requests" ("companyId", "requestType", "requestedDate" DESC)
WHERE "requestType" = 'ASSET_BREAKDOWN';

-- Index for faster spare parts lookup by request ID (for batch fetching)
CREATE INDEX IF NOT EXISTS "idx_spare_parts_request" 
ON "spare_parts" ("createdFromRequestId", "companyId")
WHERE "createdFromRequestId" IS NOT NULL;

-- Index for faster spare parts lookup by part number during execution
CREATE INDEX IF NOT EXISTS "idx_spare_parts_lookup" 
ON "spare_parts" ("companyId", "partNumber")
WHERE "partNumber" IS NOT NULL;

-- Index for faster spare parts lookup by name during execution  
CREATE INDEX IF NOT EXISTS "idx_spare_parts_name" 
ON "spare_parts" ("companyId", "name");

-- Index for asset requests search by title and description
CREATE INDEX IF NOT EXISTS "idx_asset_request_search" 
ON "asset_requests" USING gin(to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", '')))
WHERE "requestType" = 'ASSET_BREAKDOWN';

-- Index for asset requests by status
CREATE INDEX IF NOT EXISTS "idx_asset_request_status" 
ON "asset_requests" ("companyId", "status", "requestedDate" DESC)
WHERE "requestType" = 'ASSET_BREAKDOWN';
