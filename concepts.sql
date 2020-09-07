use kenyaemr_kapenguria;
SELECT 
    m.concept_id,
    t.code,
    s.name as source,
    d.name AS datatype
FROM
    concept_reference_map m
        JOIN
    concept_reference_term t USING (concept_reference_term_id)
        JOIN
    concept_reference_source s USING (concept_source_id)
        JOIN
    concept c USING (concept_id)
        JOIN
    concept_datatype d ON (datatype_id = concept_datatype_id) 
order by concept_id;
    
    
select count(*) as obs, concept_id from
 (SELECT 
    o.obs_id, o.concept_id
FROM
    obs o
        LEFT OUTER JOIN
    (SELECT 
        m.concept_id, t.code, s.name AS source, d.name AS datatype
    FROM
        concept_reference_map m
    JOIN concept_reference_term t USING (concept_reference_term_id)
    JOIN concept_reference_source s USING (concept_source_id)
    JOIN concept c USING (concept_id)
    JOIN concept_datatype d ON (datatype_id = concept_datatype_id)) c USING (concept_id)
WHERE
    c.concept_id IS NULL) c group by c.concept_id;
    
select count(*) as obs, concept_id from
 (SELECT 
    o.obs_id, o.value_coded as concept_id
FROM
    obs o
        LEFT OUTER JOIN
    (SELECT 
        m.concept_id, t.code, s.name AS source, d.name AS datatype
    FROM
        concept_reference_map m
    JOIN concept_reference_term t USING (concept_reference_term_id)
    JOIN concept_reference_source s USING (concept_source_id)
    JOIN concept c USING (concept_id)
    JOIN concept_datatype d ON (datatype_id = concept_datatype_id)) c on (c.concept_id = o.value_coded)
WHERE
    c.concept_id IS NULL and o.value_coded is not null) c group by c.concept_id;
    
select * from
 (SELECT 
   c.*
FROM
    obs o
        LEFT OUTER JOIN
    (SELECT 
        m.concept_id, t.code, s.name AS source, d.name AS datatype, concat(t.code,s.name ) as source_code
    FROM
        concept_reference_map m
    JOIN concept_reference_term t USING (concept_reference_term_id)
    JOIN concept_reference_source s USING (concept_source_id)
    JOIN concept c USING (concept_id)
    JOIN concept_datatype d ON (datatype_id = concept_datatype_id)) c USING (concept_id)
WHERE
    c.concept_id IS NOT NULL) c group by source_code;
    
select * from
 (SELECT 
    c.*
FROM
    obs o
        LEFT OUTER JOIN
    (SELECT 
        m.concept_id, t.code, s.name AS source, d.name AS datatype, concat(t.code,s.name ) as source_code
    FROM
        concept_reference_map m
    JOIN concept_reference_term t USING (concept_reference_term_id)
    JOIN concept_reference_source s USING (concept_source_id)
    JOIN concept c USING (concept_id)
    JOIN concept_datatype d ON (datatype_id = concept_datatype_id)) c on (c.concept_id = o.value_coded)
WHERE
    c.concept_id IS NOT NULL and o.value_coded is not null) c  group by source_code;
    
select * from
 (SELECT 
   c.*
FROM
    orders o
        LEFT OUTER JOIN
    (SELECT 
        m.concept_id, t.code, s.name AS source, d.name AS datatype, concat(t.code,s.name ) as source_code
    FROM
        concept_reference_map m
    JOIN concept_reference_term t USING (concept_reference_term_id)
    JOIN concept_reference_source s USING (concept_source_id)
    JOIN concept c USING (concept_id)
    JOIN concept_datatype d ON (datatype_id = concept_datatype_id)) c USING (concept_id)
WHERE
    c.concept_id IS NOT NULL) c group by source_code;
    
select * from
 (SELECT 
   c.*
FROM
    drug o
        LEFT OUTER JOIN
    (SELECT 
        m.concept_id, t.code, s.name AS source, d.name AS datatype, concat(t.code,s.name ) as source_code
    FROM
        concept_reference_map m
    JOIN concept_reference_term t USING (concept_reference_term_id)
    JOIN concept_reference_source s USING (concept_source_id)
    JOIN concept c USING (concept_id)
    JOIN concept_datatype d ON (datatype_id = concept_datatype_id)) c USING (concept_id)
WHERE
    c.concept_id IS NOT NULL) c group by source_code;