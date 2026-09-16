-- Pen-E Learning Node Contract v3
--
-- Pen-E evidence must target the exact observable Learning Node.
-- curriculum_node_id remains available as curriculum hierarchy/context
-- and for backwards compatibility with existing Pen-E records.


-- ============================================================
-- 1. Evidence suggestions: add exact Learning Node identity
-- ============================================================

alter table public.aeos_pen_e_evidence_suggestions
  add column if not exists learning_node_id text;

alter table public.aeos_pen_e_evidence_suggestions
  drop constraint if exists aeos_pen_e_evidence_suggestions_learning_node_id_fkey;

alter table public.aeos_pen_e_evidence_suggestions
  add constraint aeos_pen_e_evidence_suggestions_learning_node_id_fkey
  foreign key (learning_node_id)
  references public.aeos_learning_nodes(learning_node_id)
  on delete restrict;

create index if not exists
  aeos_pen_e_evidence_suggestions_learning_node_idx
on public.aeos_pen_e_evidence_suggestions(learning_node_id)
where learning_node_id is not null;

-- ============================================================
-- 2. Transcript analysis scope:
--    return eligible observable Learning Nodes
-- ============================================================

create or replace function public.aeos_transcript_analysis_scope(
  target_intake_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_intake public.aeos_learning_intake_items;
  v_programme text;
  v_subject text;
  v_level text;
  v_offering text;
  v_detected_level text;
  v_candidate_count integer;
  v_candidates jsonb;
  v_resolution_method text := 'linked_offering';
  v_scope_mode text;
  v_curriculum_framework_ids text[];
begin
  if not public.aeos_is_admin_tutor() then
    raise exception 'Admin/Tutor access required';
  end if;

  select *
  into v_intake
  from public.aeos_learning_intake_items
  where intake_item_id = target_intake_item_id;

  if not found then
    raise exception 'Learning Intake item not found';
  end if;

  if v_intake.intake_type <> 'transcript' then
    raise exception 'Transcript intake required';
  end if;

  select
    o.programme_id,
    o.subject_id,
    o.audience_level_id,
    o.offering_id
  into
    v_programme,
    v_subject,
    v_level,
    v_offering
  from public.aeos_offerings o
  where o.offering_id = v_intake.offering_id
    and o.status = 'Active';

  if v_programme is null
     or v_subject is null then
    raise exception 'Active offering scope not found';
  end if;


  -- ----------------------------------------------------------
  -- Preserve historical Primary level resolution.
  -- ----------------------------------------------------------

  if v_programme = 'PRI'
     and v_subject = 'MATH'
     and coalesce(
       (v_intake.extracted_metadata->>'historical_import')::boolean,
       false
     )
  then
    v_detected_level :=
      case
        when coalesce(v_intake.source_name, '') ~*
             '(Std|Standard)[ _-]*3'
          or left(
               coalesce(v_intake.normalized_content, ''),
               500
             ) ~* '(Std|Standard)[ _-]*3'
        then 'STD3'

        when coalesce(v_intake.source_name, '') ~*
             '(Std|Standard)[ _-]*4'
          or left(
               coalesce(v_intake.normalized_content, ''),
               500
             ) ~* '(Std|Standard)[ _-]*4'
        then 'STD4'

        when coalesce(v_intake.source_name, '') ~*
             '(Std|Standard)[ _-]*5'
          or left(
               coalesce(v_intake.normalized_content, ''),
               500
             ) ~* '(Std|Standard)[ _-]*5'
        then 'STD5'

        else null
      end;

    if v_detected_level is not null
       and v_detected_level <> v_level
    then
      select o.offering_id
      into v_offering
      from public.aeos_offerings o
      where o.programme_id = v_programme
        and o.subject_id = v_subject
        and o.audience_level_id = v_detected_level
        and o.status = 'Active'
      order by o.offering_id
      limit 1;

      if v_offering is not null then
        v_level := v_detected_level;
        v_resolution_method :=
          'historical_source_level';
      end if;
    end if;
  end if;


  -- ----------------------------------------------------------
  -- Determine active curriculum frameworks for the effective
  -- offering.
  --
  -- Internal sequencing frameworks such as FW-AS are not part
  -- of the curriculum evidence universe.
  -- ----------------------------------------------------------

  select
    coalesce(
      array_agg(distinct ofw.framework_id),
      array[]::text[]
    )
  into v_curriculum_framework_ids
  from public.aeos_offering_frameworks ofw
  where ofw.offering_id = v_offering
    and ofw.status = 'Active'
    and ofw.relationship_type in (
      'curriculum',
      'curriculum_and_assessment'
    );


  -- ----------------------------------------------------------
  -- Determine scope mode.
  --
  -- This preserves the established AEOS distinction:
  -- Primary Mathematics uses curriculum level expectations.
  -- Framework-backed offerings use their curriculum framework.
  -- ----------------------------------------------------------

  if v_programme = 'PRI'
     and v_subject = 'MATH'
  then
    v_scope_mode := 'primary_level_cle';

  elsif cardinality(v_curriculum_framework_ids) > 0
  then
    v_scope_mode := 'framework_scope';

  else
    v_scope_mode := 'offering_programme_fallback';
  end if;


  -- ----------------------------------------------------------
  -- Primary Mathematics
  --
  -- CLE establishes which curriculum nodes are available at
  -- the effective level. Those nodes are then resolved to the
  -- actual active observable skill Learning Nodes.
  -- ----------------------------------------------------------

  if v_scope_mode = 'primary_level_cle' then

    with eligible as (
      select distinct
        ln.learning_node_id,
        ln.curriculum_node_id,
        ln.subject_id,
        ln.origin_programme_id,
        ln.source_label,
        ln.observable_statement,
        ln.learning_outcome,
        cn.node_name as curriculum_node_name,
        cn.node_type as curriculum_node_type,
        cn.sequence as curriculum_sequence,
        cle.source_status,
        cle.progression_status,
        cle.expectation_text,
        cle.content_constraints
      from public.aeos_curriculum_level_expectations cle
      join public.aeos_curriculum_nodes cn
        on cn.curriculum_node_id =
           cle.curriculum_node_id
      join public.aeos_learning_nodes ln
        on ln.curriculum_node_id =
           cn.curriculum_node_id
      where cle.level_id = v_level
        and cle.status = 'Active'
        and cn.programme_id = v_programme
        and cn.subject_id = v_subject
        and cn.status = 'Active'
        and ln.subject_id = v_subject
        and ln.origin_programme_id = v_programme
        and ln.node_type = 'skill'
        and ln.is_observable is true
        and ln.status = 'Active'
    )
    select
      count(*)::integer,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'learning_node_id',
              eligible.learning_node_id,
            'curriculum_node_id',
              eligible.curriculum_node_id,
            'source_label',
              eligible.source_label,
            'observable_statement',
              eligible.observable_statement,
            'learning_outcome',
              eligible.learning_outcome,
            'origin_programme_id',
              eligible.origin_programme_id,
            'curriculum_node_name',
              eligible.curriculum_node_name,
            'curriculum_node_type',
              eligible.curriculum_node_type,
            'source_status',
              eligible.source_status,
            'progression_status',
              eligible.progression_status,
            'expectation_text',
              eligible.expectation_text,
            'content_constraints',
              eligible.content_constraints
          )
          order by
            eligible.curriculum_sequence,
            eligible.learning_node_id
        ),
        '[]'::jsonb
      )
    into
      v_candidate_count,
      v_candidates
    from eligible;


  -- ----------------------------------------------------------
  -- Framework-backed scope
  --
  -- Framework mappings identify the eligible Learning Nodes.
  -- DISTINCT removes duplicate mapping rows for the same skill.
  -- No origin_programme_id restriction is applied because an
  -- ADULT offering may legitimately consume SEC/CSEC skills.
  -- ----------------------------------------------------------

  elsif v_scope_mode = 'framework_scope' then

    with eligible as (
      select distinct
        ln.learning_node_id,
        ln.curriculum_node_id,
        ln.subject_id,
        ln.origin_programme_id,
        ln.source_label,
        ln.observable_statement,
        ln.learning_outcome,
        cn.node_name as curriculum_node_name,
        cn.node_type as curriculum_node_type,
        cn.sequence as curriculum_sequence
      from public.aeos_framework_mappings fm
      join public.aeos_learning_nodes ln
        on ln.learning_node_id =
           fm.learning_node_id
      left join public.aeos_curriculum_nodes cn
        on cn.curriculum_node_id =
           ln.curriculum_node_id
      where fm.framework_id =
            any(v_curriculum_framework_ids)
        and fm.status = 'Active'
        and ln.subject_id = v_subject
        and ln.node_type = 'skill'
        and ln.is_observable is true
        and ln.status = 'Active'
    )
    select
      count(*)::integer,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'learning_node_id',
              eligible.learning_node_id,
            'curriculum_node_id',
              eligible.curriculum_node_id,
            'source_label',
              eligible.source_label,
            'observable_statement',
              eligible.observable_statement,
            'learning_outcome',
              eligible.learning_outcome,
            'origin_programme_id',
              eligible.origin_programme_id,
            'curriculum_node_name',
              eligible.curriculum_node_name,
            'curriculum_node_type',
              eligible.curriculum_node_type,
            'source_status',
              null,
            'progression_status',
              null,
            'expectation_text',
              null,
            'content_constraints',
              null
          )
          order by
            eligible.curriculum_sequence
              nulls last,
            eligible.learning_node_id
        ),
        '[]'::jsonb
      )
    into
      v_candidate_count,
      v_candidates
    from eligible;


  -- ----------------------------------------------------------
  -- Compatibility fallback
  --
  -- For offerings without an attached curriculum framework,
  -- retain the old programme/subject behaviour, but return
  -- Learning Nodes rather than curriculum nodes.
  -- ----------------------------------------------------------

  else

    with eligible as (
      select distinct
        ln.learning_node_id,
        ln.curriculum_node_id,
        ln.subject_id,
        ln.origin_programme_id,
        ln.source_label,
        ln.observable_statement,
        ln.learning_outcome,
        cn.node_name as curriculum_node_name,
        cn.node_type as curriculum_node_type,
        cn.sequence as curriculum_sequence
      from public.aeos_learning_nodes ln
      left join public.aeos_curriculum_nodes cn
        on cn.curriculum_node_id =
           ln.curriculum_node_id
      where ln.origin_programme_id = v_programme
        and ln.subject_id = v_subject
        and ln.node_type = 'skill'
        and ln.is_observable is true
        and ln.status = 'Active'
    )
    select
      count(*)::integer,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'learning_node_id',
              eligible.learning_node_id,
            'curriculum_node_id',
              eligible.curriculum_node_id,
            'source_label',
              eligible.source_label,
            'observable_statement',
              eligible.observable_statement,
            'learning_outcome',
              eligible.learning_outcome,
            'origin_programme_id',
              eligible.origin_programme_id,
            'curriculum_node_name',
              eligible.curriculum_node_name,
            'curriculum_node_type',
              eligible.curriculum_node_type,
            'source_status',
              null,
            'progression_status',
              null,
            'expectation_text',
              null,
            'content_constraints',
              null
          )
          order by
            eligible.curriculum_sequence
              nulls last,
            eligible.learning_node_id
        ),
        '[]'::jsonb
      )
    into
      v_candidate_count,
      v_candidates
    from eligible;

  end if;


  return jsonb_build_object(
    'contract_version',
      'aeos-transcript-analysis-scope-v3',
    'intake_item_id',
      v_intake.intake_item_id,
    'linked_offering_id',
      v_intake.offering_id,
    'effective_offering_id',
      v_offering,
    'programme_id',
      v_programme,
    'subject_id',
      v_subject,
    'effective_level_id',
      v_level,
    'detected_historical_level_id',
      v_detected_level,
    'resolution_method',
      v_resolution_method,
    'scope_mode',
      v_scope_mode,
    'curriculum_framework_ids',
      to_jsonb(v_curriculum_framework_ids),
    'candidate_count',
      v_candidate_count,
    'candidates',
      v_candidates
  );
end;
$function$;

-- ============================================================
-- 3. Manual Pen-E import:
--    evidence may target exact Learning Nodes
-- ============================================================

create or replace function public.aeos_import_manual_pen_e_analysis(
  target_intake_item_id uuid,
  target_analysis jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_intake public.aeos_learning_intake_items;
  v_run_id uuid;
  v_item jsonb;
  v_node_id text;
  v_learning_node_id text;
  v_programme_id text;
  v_subject_id text;
  v_scope jsonb;
  v_scope_candidates jsonb;
  v_resolved_curriculum_node_id text;
begin
  if not public.aeos_is_admin_tutor() then
    raise exception 'Admin/Tutor access required';
  end if;

  if target_analysis is null
     or jsonb_typeof(target_analysis) <> 'object' then
    raise exception 'Manual Pen-E analysis must be a JSON object';
  end if;

  -- Hard boundary: transcript-intake JSON is source material,
  -- not Pen-E analysis output.
  if coalesce(target_analysis->>'schema_version','')
       like 'aeos-transcript-intake-%'
     or (
       target_analysis ? 'segments'
       and not target_analysis ? 'curriculum_matches'
     )
  then
    raise exception
      'Transcript Intake JSON cannot be imported as Pen-E analysis. Run the Stage-2 Pen-E analysis prompt and import that JSON instead.';
  end if;

  if not (target_analysis ? 'session_summary')
     or not (target_analysis ? 'overall_confidence')
     or not (target_analysis ? 'curriculum_matches')
     or not (target_analysis ? 'evidence')
     or not (target_analysis ? 'actions')
  then
    raise exception
      'Invalid Pen-E analysis contract. Required keys: session_summary, overall_confidence, curriculum_matches, evidence, actions';
  end if;

  if jsonb_typeof(target_analysis->'curriculum_matches') <> 'array'
     or jsonb_typeof(target_analysis->'evidence') <> 'array'
     or jsonb_typeof(target_analysis->'actions') <> 'array'
  then
    raise exception
      'curriculum_matches, evidence and actions must be JSON arrays';
  end if;

  if (target_analysis->>'overall_confidence')::numeric < 0
     or (target_analysis->>'overall_confidence')::numeric > 100
  then
    raise exception
      'overall_confidence must be between 0 and 100';
  end if;

  select *
  into v_intake
  from public.aeos_learning_intake_items
  where intake_item_id = target_intake_item_id;

  if not found then
    raise exception 'Learning Intake item not found';
  end if;

  if v_intake.intake_type <> 'transcript' then
    raise exception
      'Manual Pen-E supports transcript intake only';
  end if;

  if v_intake.session_id is null
     or v_intake.student_user_id is null
     or v_intake.offering_id is null
  then
    raise exception
      'Intake item is missing Session/Student/Offering linkage';
  end if;

  select
    o.programme_id,
    o.subject_id
  into
    v_programme_id,
    v_subject_id
  from public.aeos_offerings o
  where o.offering_id = v_intake.offering_id
    and o.status = 'Active';

  if v_programme_id is null
     or v_subject_id is null
  then
    raise exception
      'Offering is missing active programme/subject scope';
  end if;


  -- Resolve the authoritative Pen-E scope once.
  v_scope :=
    public.aeos_transcript_analysis_scope(
      target_intake_item_id
    );

  v_scope_candidates :=
    coalesce(v_scope->'candidates', '[]'::jsonb);


  -- ----------------------------------------------------------
  -- Curriculum suggestions
  --
  -- Keep the existing curriculum_matches contract intact for
  -- this migration. The node must exist and be represented by
  -- at least one eligible Learning Node in the resolved scope.
  -- ----------------------------------------------------------

  for v_item in
    select value
    from jsonb_array_elements(
      target_analysis->'curriculum_matches'
    )
  loop
    v_node_id :=
      nullif(
        trim(v_item->>'curriculum_node_id'),
        ''
      );

    if v_node_id is null then
      raise exception
        'Every curriculum_matches item requires curriculum_node_id';
    end if;

    if not exists (
      select 1
      from jsonb_array_elements(v_scope_candidates)
        as candidate(value)
      where candidate.value->>'curriculum_node_id'
        = v_node_id
    ) then
      raise exception
        'curriculum_node_id % is outside the resolved Pen-E curriculum scope',
        v_node_id;
    end if;
  end loop;


  -- ----------------------------------------------------------
  -- Evidence
  --
  -- New contract:
  --   learning_node_id = exact skill identity
  --   curriculum_node_id = optional hierarchy/context
  --
  -- Evidence may remain completely unmapped for Tutor Review.
  -- ----------------------------------------------------------

  for v_item in
    select value
    from jsonb_array_elements(
      target_analysis->'evidence'
    )
  loop
    v_learning_node_id :=
      nullif(
        trim(v_item->>'learning_node_id'),
        ''
      );

    v_node_id :=
      nullif(
        trim(v_item->>'curriculum_node_id'),
        ''
      );

    if v_learning_node_id is not null then

      if not exists (
        select 1
        from jsonb_array_elements(v_scope_candidates)
          as candidate(value)
        where candidate.value->>'learning_node_id'
          = v_learning_node_id
      ) then
        raise exception
          'Evidence learning_node_id % is outside the resolved Pen-E skill scope',
          v_learning_node_id;
      end if;

      select
        candidate.value->>'curriculum_node_id'
      into v_resolved_curriculum_node_id
      from jsonb_array_elements(v_scope_candidates)
        as candidate(value)
      where candidate.value->>'learning_node_id'
        = v_learning_node_id
      limit 1;

      -- If JSON also supplies curriculum_node_id, it must agree
      -- with the selected Learning Node.
      if v_node_id is not null
         and v_node_id <>
             v_resolved_curriculum_node_id
      then
        raise exception
          'Evidence learning_node_id % belongs to curriculum_node_id %, not %',
          v_learning_node_id,
          v_resolved_curriculum_node_id,
          v_node_id;
      end if;

    elsif v_node_id is not null then

  -- Legacy curriculum-node-only evidence is permitted into
  -- Tutor Review as long as the curriculum node belongs to
  -- the resolved Pen-E scope.
  --
  -- If it resolves to exactly one Learning Node, the insert
  -- stage below will upgrade it automatically.
  --
  -- If it resolves to multiple Learning Nodes, it remains
  -- curriculum-node-only and requires Link Skill before
  -- acceptance.
  if not exists (
    select 1
    from jsonb_array_elements(v_scope_candidates)
      as candidate(value)
    where candidate.value->>'curriculum_node_id'
      = v_node_id
  ) then
    raise exception
      'Evidence curriculum_node_id % is outside the resolved Pen-E skill scope',
      v_node_id;
  end if;

end if;

  end loop;


  insert into public.aeos_pen_e_analysis_runs (
    intake_item_id,
    session_id,
    student_user_id,
    offering_id,
    model_provider,
    model_name,
    prompt_version,
    run_status,
    session_summary,
    overall_confidence,
    raw_model_output,
    started_at,
    completed_at,
    requested_by
  )
  values (
    v_intake.intake_item_id,
    v_intake.session_id,
    v_intake.student_user_id,
    v_intake.offering_id,
    'Manual',
    'ChatGPT Manual Bridge',
    'pen-e-manual-v3',
    'completed',
    nullif(
      trim(target_analysis->>'session_summary'),
      ''
    ),
    (target_analysis->>'overall_confidence')::numeric,
    target_analysis,
    now(),
    now(),
    auth.uid()
  )
  returning analysis_run_id
  into v_run_id;


  -- Curriculum suggestions remain curriculum-node based.
  for v_item in
    select value
    from jsonb_array_elements(
      target_analysis->'curriculum_matches'
    )
  loop
    v_node_id :=
      nullif(
        trim(v_item->>'curriculum_node_id'),
        ''
      );

    insert into public.aeos_pen_e_curriculum_suggestions (
      analysis_run_id,
      curriculum_node_id,
      confidence,
      source_excerpt,
      source_timestamp,
      explanation
    )
    values (
      v_run_id,
      v_node_id,
      coalesce(
        (v_item->>'confidence')::numeric,
        0
      ),
      nullif(
        trim(v_item->>'source_excerpt'),
        ''
      ),
      nullif(
        trim(v_item->>'source_timestamp'),
        ''
      ),
      nullif(
        trim(v_item->>'explanation'),
        ''
      )
    )
    on conflict (
      analysis_run_id,
      curriculum_node_id
    ) do nothing;
  end loop;


  -- Evidence suggestions now persist exact Learning Node
  -- identity whenever supplied.
  for v_item in
    select value
    from jsonb_array_elements(
      target_analysis->'evidence'
    )
  loop
    v_learning_node_id :=
      nullif(
        trim(v_item->>'learning_node_id'),
        ''
      );

    v_node_id :=
      nullif(
        trim(v_item->>'curriculum_node_id'),
        ''
      );

    -- Legacy curriculum-node-only evidence can be safely
    -- upgraded during import when resolution is unambiguous.
    if v_learning_node_id is null
   and v_node_id is not null
then
  select
    case
      when count(*) = 1
      then min(
        candidate.value->>'learning_node_id'
      )
      else null
    end
  into v_learning_node_id
  from jsonb_array_elements(v_scope_candidates)
    as candidate(value)
  where candidate.value->>'curriculum_node_id'
    = v_node_id;
end if;

    -- If an exact Learning Node is supplied, derive its
    -- curriculum context rather than trusting duplicated input.
    if v_learning_node_id is not null then
      select
        candidate.value->>'curriculum_node_id'
      into v_resolved_curriculum_node_id
      from jsonb_array_elements(v_scope_candidates)
        as candidate(value)
      where candidate.value->>'learning_node_id'
        = v_learning_node_id
      limit 1;

      v_node_id :=
        v_resolved_curriculum_node_id;
    end if;

    insert into public.aeos_pen_e_evidence_suggestions (
      analysis_run_id,
      learning_node_id,
      curriculum_node_id,
      evidence_type,
      evidence_statement,
      source_excerpt,
      source_timestamp,
      confidence,
      explanation
    )
    values (
      v_run_id,
      v_learning_node_id,
      v_node_id,
      v_item->>'evidence_type',
      v_item->>'evidence_statement',
      coalesce(
        v_item->>'source_excerpt',
        ''
      ),
      nullif(
        trim(v_item->>'source_timestamp'),
        ''
      ),
      coalesce(
        (v_item->>'confidence')::numeric,
        0
      ),
      nullif(
        trim(v_item->>'explanation'),
        ''
      )
    );
  end loop;


  for v_item in
    select value
    from jsonb_array_elements(
      target_analysis->'actions'
    )
  loop
    insert into public.aeos_pen_e_action_suggestions (
      analysis_run_id,
      action_origin,
      action_type,
      action_title,
      action_description,
      source_excerpt,
      source_timestamp,
      target_role,
      suggested_due_text,
      confidence,
      explanation
    )
    values (
      v_run_id,
      v_item->>'action_origin',
      v_item->>'action_type',
      v_item->>'action_title',
      nullif(
        trim(v_item->>'action_description'),
        ''
      ),
      nullif(
        trim(v_item->>'source_excerpt'),
        ''
      ),
      nullif(
        trim(v_item->>'source_timestamp'),
        ''
      ),
      nullif(
        trim(v_item->>'target_role'),
        ''
      ),
      nullif(
        trim(v_item->>'suggested_due_text'),
        ''
      ),
      coalesce(
        (v_item->>'confidence')::numeric,
        0
      ),
      nullif(
        trim(v_item->>'explanation'),
        ''
      )
    );
  end loop;


  update public.aeos_learning_intake_items
  set
    processing_status = 'completed',
    processed_at = now(),
    error_message = null
  where intake_item_id =
    v_intake.intake_item_id;

  return v_run_id;
end;
$function$;

-- ============================================================
-- 4. Tutor Review: link evidence to an exact Learning Node
-- ============================================================

-- The deployed v2 RPC has the same PostgreSQL type signature
-- (uuid, text) but names its second argument
-- target_curriculum_node_id.
--
-- PostgreSQL does not use argument names to identify a
-- function, and CREATE OR REPLACE must not be used to rename
-- an existing input parameter. There are no dependent database
-- objects on the deployed RPC, so recreate it with the v3
-- Learning Node contract.

drop function if exists
  public.aeos_link_pen_e_evidence_skill(uuid, text);

create function public.aeos_link_pen_e_evidence_skill(
  target_evidence_suggestion_id uuid,
  target_learning_node_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_suggestion public.aeos_pen_e_evidence_suggestions%rowtype;
  v_run public.aeos_pen_e_analysis_runs%rowtype;
  v_scope jsonb;
  v_scope_candidates jsonb;
  v_learning_node_id text;
  v_curriculum_node_id text;
begin
  if not public.aeos_is_admin_tutor() then
    raise exception 'Admin/Tutor access required';
  end if;

  if target_evidence_suggestion_id is null then
    raise exception 'Evidence suggestion ID is required';
  end if;

  v_learning_node_id :=
    nullif(trim(target_learning_node_id), '');

  if v_learning_node_id is null then
    raise exception 'Learning Node ID is required';
  end if;


  -- Lock the evidence suggestion while its mapping changes.
  select *
  into v_suggestion
  from public.aeos_pen_e_evidence_suggestions
  where evidence_suggestion_id =
    target_evidence_suggestion_id
  for update;

  if not found then
    raise exception
      'Evidence suggestion % not found',
      target_evidence_suggestion_id;
  end if;

  if v_suggestion.review_status <> 'pending_review' then
    raise exception
      'Only pending evidence suggestions can be linked to a skill';
  end if;


  select *
  into v_run
  from public.aeos_pen_e_analysis_runs
  where analysis_run_id =
    v_suggestion.analysis_run_id;

  if not found then
    raise exception
      'Analysis run % not found',
      v_suggestion.analysis_run_id;
  end if;

  if v_run.intake_item_id is null then
    raise exception
      'Analysis run is missing Learning Intake linkage';
  end if;


  -- Use the same authoritative scope used by analysis/import.
  v_scope :=
    public.aeos_transcript_analysis_scope(
      v_run.intake_item_id
    );

  v_scope_candidates :=
    coalesce(
      v_scope->'candidates',
      '[]'::jsonb
    );


  -- The selected Learning Node must be an eligible skill for
  -- this exact transcript/offering scope.
  select
    candidate.value->>'curriculum_node_id'
  into v_curriculum_node_id
  from jsonb_array_elements(v_scope_candidates)
    as candidate(value)
  where candidate.value->>'learning_node_id'
    = v_learning_node_id
  limit 1;

  if not found then
    raise exception
      'Learning Node % is outside the resolved Pen-E skill scope',
      v_learning_node_id;
  end if;


  -- Persist exact skill identity and derive curriculum context
  -- from that skill. Never trust the client to pair these IDs.
  update public.aeos_pen_e_evidence_suggestions
  set
    learning_node_id = v_learning_node_id,
    curriculum_node_id = v_curriculum_node_id,
    updated_at = now()
  where evidence_suggestion_id =
    target_evidence_suggestion_id;
end;
$function$;


-- Remove PUBLIC/anon access inherited from function creation.
revoke all on function
  public.aeos_link_pen_e_evidence_skill(uuid, text)
from public;

revoke all on function
  public.aeos_link_pen_e_evidence_skill(uuid, text)
from anon;

grant execute on function
  public.aeos_link_pen_e_evidence_skill(uuid, text)
to authenticated;

grant execute on function
  public.aeos_link_pen_e_evidence_skill(uuid, text)
to service_role;


-- ============================================================
-- 5. Tutor Review:
--    accepted evidence writes exact Learning Node evidence
-- ============================================================

create or replace function public.aeos_review_pen_e_suggestion(
  target_table text,
  target_id uuid,
  target_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_suggestion public.aeos_pen_e_evidence_suggestions%rowtype;
  v_run public.aeos_pen_e_analysis_runs%rowtype;
  v_learning_node_id text;
  v_learning_node_count integer;
  v_existing_evidence_id uuid;
  v_scope jsonb;
  v_scope_candidates jsonb;
  v_resolved_curriculum_node_id text;
  v_now timestamptz := now();
begin
  if not public.aeos_is_admin_tutor() then
    raise exception 'Admin/Tutor access required';
  end if;

  if target_status not in ('accepted','rejected') then
    raise exception 'Unsupported review status';
  end if;

  if target_table = 'curriculum' then
    update public.aeos_pen_e_curriculum_suggestions
    set
      review_status = target_status,
      reviewed_by = auth.uid(),
      reviewed_at = v_now
    where curriculum_suggestion_id = target_id;

    if not found then
      raise exception
        'Curriculum suggestion % not found',
        target_id;
    end if;


  elsif target_table = 'evidence' then

    -- Serialize decisions for the same evidence suggestion so
    -- repeated Accept clicks cannot create duplicate durable
    -- evidence.
    perform pg_advisory_xact_lock(
      hashtextextended(target_id::text, 0)
    );

    select *
    into v_suggestion
    from public.aeos_pen_e_evidence_suggestions
    where evidence_suggestion_id = target_id
    for update;

    if not found then
      raise exception
        'Evidence suggestion % not found',
        target_id;
    end if;


    if target_status = 'rejected' then
      -- Rejection changes only review state. It does not delete
      -- previously approved durable evidence.
      update public.aeos_pen_e_evidence_suggestions
      set
        review_status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = v_now
      where evidence_suggestion_id = target_id;

      return;
    end if;


    select *
    into v_run
    from public.aeos_pen_e_analysis_runs
    where analysis_run_id =
      v_suggestion.analysis_run_id;

    if not found then
      raise exception
        'Analysis run % not found',
        v_suggestion.analysis_run_id;
    end if;

    if v_run.session_id is null
       or v_run.student_user_id is null
    then
      raise exception
        'Analysis run is missing Session/Student linkage';
    end if;

    if v_run.intake_item_id is null then
      raise exception
        'Analysis run is missing Learning Intake linkage';
    end if;


    -- --------------------------------------------------------
    -- Resolve the authoritative skill universe for this exact
    -- transcript/offering.
    -- --------------------------------------------------------

    v_scope :=
      public.aeos_transcript_analysis_scope(
        v_run.intake_item_id
      );

    v_scope_candidates :=
      coalesce(
        v_scope->'candidates',
        '[]'::jsonb
      );


    -- --------------------------------------------------------
    -- v3 path:
    -- suggestion already carries exact Learning Node identity.
    -- --------------------------------------------------------

    if v_suggestion.learning_node_id is not null then

      select
        candidate.value->>'curriculum_node_id'
      into v_resolved_curriculum_node_id
      from jsonb_array_elements(v_scope_candidates)
        as candidate(value)
      where candidate.value->>'learning_node_id'
        = v_suggestion.learning_node_id
      limit 1;

      if not found then
        raise exception
          'Evidence suggestion % references Learning Node % outside the resolved Pen-E skill scope',
          target_id,
          v_suggestion.learning_node_id;
      end if;

      v_learning_node_id :=
        v_suggestion.learning_node_id;


      -- Keep hierarchy/context synchronized with the exact LN.
      if v_suggestion.curriculum_node_id
           is distinct from
         v_resolved_curriculum_node_id
      then
        update public.aeos_pen_e_evidence_suggestions
        set
          curriculum_node_id =
            v_resolved_curriculum_node_id,
          updated_at = v_now
        where evidence_suggestion_id = target_id;

        v_suggestion.curriculum_node_id :=
          v_resolved_curriculum_node_id;
      end if;


    -- --------------------------------------------------------
    -- Legacy path:
    -- old suggestion has curriculum_node_id only.
    --
    -- Resolve only inside the legitimate Pen-E scope.
    -- Exactly one eligible LN is required. Never guess.
    -- --------------------------------------------------------

    elsif v_suggestion.curriculum_node_id is not null then

      select
        count(*)::integer,
        min(
          candidate.value->>'learning_node_id'
        )
      into
        v_learning_node_count,
        v_learning_node_id
      from jsonb_array_elements(v_scope_candidates)
        as candidate(value)
      where candidate.value->>'curriculum_node_id'
        = v_suggestion.curriculum_node_id;

      if v_learning_node_count <> 1 then
        raise exception
          'Evidence suggestion % requires Link Skill: curriculum node % resolves to % eligible Learning Nodes',
          target_id,
          v_suggestion.curriculum_node_id,
          v_learning_node_count;
      end if;


      -- Safely upgrade the legacy suggestion so subsequent
      -- review reads carry exact skill identity.
      update public.aeos_pen_e_evidence_suggestions
      set
        learning_node_id =
          v_learning_node_id,
        updated_at = v_now
      where evidence_suggestion_id = target_id;

      v_suggestion.learning_node_id :=
        v_learning_node_id;


    -- --------------------------------------------------------
    -- Completely unmapped evidence must be linked by tutor.
    -- --------------------------------------------------------

    else
      raise exception
        'Evidence suggestion % requires Link Skill before acceptance',
        target_id;
    end if;


    -- --------------------------------------------------------
    -- Idempotence is anchored in durable provenance kept in
    -- evidence_detail. Advisory lock closes concurrent Accept.
    -- --------------------------------------------------------

    select e.evidence_id
    into v_existing_evidence_id
    from public.aeos_learning_evidence e
    where e.evidence_detail
            ->> 'pen_e_evidence_suggestion_id'
          = target_id::text
    limit 1;


    if v_existing_evidence_id is null then

      insert into public.aeos_learning_evidence (
        student_user_id,
        learning_node_id,
        session_id,
        evidence_source_type,
        evidence_summary,
        evidence_detail,
        independence_level,
        confidence_score,
        evidence_status,
        created_by_type,
        created_by,
        observed_at,
        approved_by,
        approved_at,
        extraction_version
      )
      values (
        v_run.student_user_id,
        v_learning_node_id,
        v_run.session_id,
        'transcript',

        coalesce(
          nullif(
            trim(v_suggestion.edited_statement),
            ''
          ),
          v_suggestion.evidence_statement
        ),

        jsonb_build_object(
          'source',
            'pen_e_evidence_suggestion',

          'pen_e_evidence_suggestion_id',
            v_suggestion.evidence_suggestion_id,

          'analysis_run_id',
            v_suggestion.analysis_run_id,

          'learning_node_id',
            v_learning_node_id,

          'curriculum_node_id',
            v_suggestion.curriculum_node_id,

          'evidence_type',
            v_suggestion.evidence_type,

          'source_excerpt',
            v_suggestion.source_excerpt,

          'source_timestamp',
            v_suggestion.source_timestamp,

          'explanation',
            v_suggestion.explanation,

          'original_confidence_percent',
            v_suggestion.confidence,

          'review_contract',
            'pen-e-learning-node-v3'
        ),

        case
          when v_suggestion.evidence_type =
               'independent_success'
            then 'independent'

          when v_suggestion.evidence_type =
               'needs_prompting'
            then 'prompted'

          else null
        end,

        case
          when v_suggestion.confidence is null
            then null
          else
            greatest(
              0::numeric,
              least(
                1::numeric,
                v_suggestion.confidence / 100.0
              )
            )
        end,

        'approved',
        'ai',
        null,

        coalesce(
          v_run.completed_at,
          v_run.started_at,
          v_now
        ),

        auth.uid(),
        v_now,

        coalesce(
          v_run.prompt_version,
          'pen-e'
        )
      );

    end if;


    update public.aeos_pen_e_evidence_suggestions
    set
      review_status = 'accepted',
      reviewed_by = auth.uid(),
      reviewed_at = v_now
    where evidence_suggestion_id = target_id;


  elsif target_table = 'action' then

    update public.aeos_pen_e_action_suggestions
    set
      review_status = target_status,
      reviewed_by = auth.uid(),
      reviewed_at = v_now
    where action_suggestion_id = target_id;

    if not found then
      raise exception
        'Action suggestion % not found',
        target_id;
    end if;


  else
    raise exception
      'Unknown Pen-E suggestion table';
  end if;
end;
$function$;



