# 01_medallion.py — Run at 9AM, 0-2h
# Bronze → Silver → Gold (Medallion) + Skills Graph

# 1. Bronze: raw synthetic dumps
# Use Assistant prompt to generate, then:
df = spark.read.csv("/Volumes/prism/bronze/students.csv", header=True)
df.write.mode("overwrite").saveAsTable("prism.bronze.students")

# 2. Silver: clean + Information Extraction (no Python parsing)
spark.sql("""
CREATE OR REPLACE TABLE prism.silver.jds AS
SELECT jd_id, company, description,
       ai_extract(description, array("skills", "role", "eligibility_cgpa")) as parsed
FROM prism.bronze.jds
""")

# 3. Gold: business-ready
spark.sql("""
CREATE OR REPLACE TABLE prism.gold.students AS
SELECT student_id, dept, cgpa, attendance, skills FROM prism.silver.students
""")

# 4. Gold Skills Graph (winning trick: skill→course→lab→company)
spark.sql("""
CREATE OR REPLACE TABLE prism.gold.skills_graph AS
SELECT skill as src, course as dst, 'skill->course' as rel, 1.0 as weight FROM prism.silver.skill_course_map
UNION ALL SELECT course, lab_id, 'course->lab', 0.9 FROM prism.silver.course_lab_map
UNION ALL SELECT lab_id, company, 'lab->company', 0.8 FROM prism.silver.lab_company_map
""")

# 5. Lakebase table for live bookings
# Run in Lakebase Postgres: CREATE TABLE prism.app.bookings (student_id STRING, lab_id STRING, ts TIMESTAMP);

print("Medallion ready. Check Unity Catalog lineage.")
