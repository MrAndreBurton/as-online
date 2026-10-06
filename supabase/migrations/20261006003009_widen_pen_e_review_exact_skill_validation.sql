CREATE OR REPLACE FUNCTION public.aeos_review_pen_e_suggestion(
  target_table text,
  target_id uuid,
  target_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS function
declare
  v_suggestion public.aeos_pen_e_evidence_suggestions%rowtype;
  v_run public.aeos_pen_e_analysis_runs%rowtype;
  v_learning_node_id text;
  v_learning_node_count integer;
  v_existing_evidence_id uuid;
  v_scope jsonb;
  v_scope_candidates jsonb;
  v_resolved_curriculum_node_id text;
  v_subject_id text;
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
    -- repeated Accept clicks cannot create duplicate durable evidence.
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

    -- Canonical educational identity is required.
    -- Portal identity is optional.
    if v_run.session_id is null
       or v_run.student_id is null
    then
      raise exception
        'Analysis run is missing Session/Student linkage';
    end if;

    if v_run.intake_item_id is null then
      raise exception
        'Analysis run is missing Learning Intake linkage';
    end if;

    -- Resolve the frozen Pen-E analysis context.
    --
    -- The scope continues to define the AI/import boundary and
    -- supplies the authoritative subject for this transcript.
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
    -- Exact Learning Node path.
    --
    -- An exact LN may have been linked deliberately by a tutor.
    -- It therefore does NOT have to belong to the narrower AI
    -- transcript-analysis candidate set.
    --
    -- Human/tutor evidence-linking boundary:
    --   same subject
    --   active
    --   observable
    --   skill
    --
    -- Programme and expected level are not permission gates.
    -- --------------------------------------------------------

    if v_suggestion.learning_node_id is not null then

      v_subject_id :=
        nullif(
          v_scope->>'subject_id',
          ''
        );

      if v_subject_id is null then
        raise exception
          'Unable to resolve subject for evidence suggestion %',
          target_id;
      end if;

      select
        ln.curriculum_node_id
      into
        v_resolved_curriculum_node_id
      from public.aeos_learning_nodes ln
      where ln.learning_node_id =
            v_suggestion.learning_node_id
        and ln.subject_id =
            v_subject_id
        and ln.node_type = 'skill'
        and ln.is_observable is true
        and ln.status = 'Active'
      limit 1;

      if not found then
        raise exception
          'Learning Node % is not an active observable % skill',
          v_suggestion.learning_node_id,
          v_subject_id;
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
    -- Legacy path.
    --
    -- A curriculum-only suggestion has NOT been deliberately
    -- linked to an exact LN by the tutor.
    --
    -- It therefore continues to resolve strictly inside the
    -- frozen Pen-E analysis scope. Exactly one eligible LN is
    -- required. Never guess.
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
        student_id,
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
        v_run.student_id,
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
function;
