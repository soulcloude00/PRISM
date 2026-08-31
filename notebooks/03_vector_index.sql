-- 03_vector_index.sql — Run at 2-4h
-- Vector Search (Mosaic AI) + UC Function

CREATE VECTOR SEARCH INDEX IF NOT EXISTS prism.gold.jds_index
ON TABLE prism.gold.jds (parsed.skills)
EMBEDDING MODEL `databricks-bge-large-en`;

CREATE OR REPLACE FUNCTION prism.gold.is_lab_free(lab_id STRING, ts TIMESTAMP)
RETURNS BOOLEAN
RETURN EXISTS (
  SELECT 1 FROM prism.gold.labs 
  WHERE id = lab_id AND ts BETWEEN free_start AND free_end
);
-- Test: SELECT prism.gold.is_lab_free('LAB-3B', now());
