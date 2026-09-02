import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import {
  fetchCurriculumBrowserData,
  fetchCurriculumNodeDetail,
} from "../../../lib/curriculum";

import "../../../styles/portal/curriculum.css";

function CurriculumPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [urlHydrated, setUrlHydrated] =
    useState(false);

  const [data, setData] = useState({
    programmes: [],
    subjects: [],
    levels: [],
    nodes: [],
  });

  const [
    selectedProgrammeId,
    setSelectedProgrammeId,
  ] = useState("");

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] = useState("");

  const [
    selectedLevelId,
    setSelectedLevelId,
  ] = useState("");

  const [
    selectedNodeId,
    setSelectedNodeId,
  ] = useState("");

  const [
    selectedNodeDetail,
    setSelectedNodeDetail,
  ] = useState(null);

  const [search, setSearch] =
    useState("");

  /*
   * --------------------------------------------------
   * Initial load
   * --------------------------------------------------
   *
   * Curriculum v1.1 understands URLs such as:
   *
   * /portal/admin/curriculum
   *   ?programme=PRI
   *   &subject=MATH
   *   &level=STD4
   *   &node=CUR-0294
   *
   * A node deep-link can also establish its own
   * programme and subject if those parameters were
   * omitted.
   */

  useEffect(() => {
    loadCurriculum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCurriculum() {
    try {
      setLoading(true);
      setError("");

      const result =
        await fetchCurriculumBrowserData();

      setData(result);

      const requestedProgrammeId =
        searchParams.get("programme") ?? "";

      const requestedSubjectId =
        searchParams.get("subject") ?? "";

      const requestedLevelId =
        searchParams.get("level") ?? "";

      const requestedNodeId =
        searchParams.get("node") ?? "";

      const requestedSearch =
        searchParams.get("q") ?? "";

      const requestedNode =
        requestedNodeId
          ? result.nodes.find(
              (node) =>
                node.curriculum_node_id ===
                requestedNodeId
            )
          : null;

      /*
       * Resolve programme.
       *
       * Priority:
       * 1. valid URL programme
       * 2. programme belonging to deep-linked node
       * 3. first available programme
       */

      const validRequestedProgramme =
        result.programmes.some(
          (programme) =>
            programme.programme_id ===
            requestedProgrammeId
        );

      let programmeId = "";

      if (validRequestedProgramme) {
        programmeId =
          requestedProgrammeId;
      } else if (
        requestedNode?.programme_id
      ) {
        programmeId =
          requestedNode.programme_id;
      } else {
        programmeId =
          result.programmes?.[0]
            ?.programme_id ?? "";
      }

      /*
       * Resolve subjects actually represented
       * inside the selected programme.
       */

      const validSubjectIds =
        getSubjectIdsForProgramme(
          result.nodes,
          programmeId
        );

      let subjectId = "";

      if (
        requestedSubjectId &&
        validSubjectIds.has(
          requestedSubjectId
        )
      ) {
        subjectId =
          requestedSubjectId;
      } else if (
        requestedNode?.subject_id &&
        validSubjectIds.has(
          requestedNode.subject_id
        )
      ) {
        subjectId =
          requestedNode.subject_id;
      } else {
        subjectId =
          result.subjects.find(
            (subject) =>
              validSubjectIds.has(
                subject.subject_id
              )
          )?.subject_id ?? "";
      }

      /*
       * Resolve level only if the level is
       * valid for this programme.
       *
       * We intentionally do NOT infer a level
       * merely because a node exists there.
       * A Pen-E deep link should supply the
       * effective session level explicitly.
       */

      const validLevelIds = new Set(
        result.levels
          .filter(
            (level) =>
              !level.programme_id ||
              level.programme_id ===
                programmeId
          )
          .map(
            (level) =>
              level.level_id
          )
      );

      const levelId =
        requestedLevelId &&
        validLevelIds.has(
          requestedLevelId
        )
          ? requestedLevelId
          : "";

      setSelectedProgrammeId(
        programmeId
      );

      setSelectedSubjectId(
        subjectId
      );

      setSelectedLevelId(
        levelId
      );

      setSearch(
        requestedSearch
      );

      /*
       * Deep-linked curriculum node.
       */

      if (requestedNode) {
        setSelectedNodeId(
          requestedNode.curriculum_node_id
        );

        try {
          const detail =
            await fetchCurriculumNodeDetail(
              requestedNode.curriculum_node_id
            );

          setSelectedNodeDetail(
            detail
          );
        } catch (detailError) {
          console.error(
            detailError
          );

          setSelectedNodeDetail(
            null
          );

          setError(
            detailError?.message ||
              "AEOS could not load the linked curriculum node."
          );
        }
      }

      setUrlHydrated(true);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "AEOS could not load the curriculum."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * URL synchronization
   * --------------------------------------------------
   *
   * Once initial hydration has happened,
   * Curriculum becomes its own stable
   * deep-link destination.
   */

  useEffect(() => {
    if (!urlHydrated) {
      return;
    }

    const next =
      new URLSearchParams();

    if (selectedProgrammeId) {
      next.set(
        "programme",
        selectedProgrammeId
      );
    }

    if (selectedSubjectId) {
      next.set(
        "subject",
        selectedSubjectId
      );
    }

    if (selectedLevelId) {
      next.set(
        "level",
        selectedLevelId
      );
    }

    if (selectedNodeId) {
      next.set(
        "node",
        selectedNodeId
      );
    }

    if (search.trim()) {
      next.set(
        "q",
        search.trim()
      );
    }

    setSearchParams(next, {
      replace: true,
    });
  }, [
    urlHydrated,
    selectedProgrammeId,
    selectedSubjectId,
    selectedLevelId,
    selectedNodeId,
    search,
    setSearchParams,
  ]);

  /*
   * --------------------------------------------------
   * Canonical maps
   * --------------------------------------------------
   */

  const allNodeMap = useMemo(() => {
    const map = new Map();

    data.nodes.forEach((node) => {
      map.set(
        node.curriculum_node_id,
        node
      );
    });

    return map;
  }, [data.nodes]);

  /*
   * --------------------------------------------------
   * Programme → Subject synchronization
   * --------------------------------------------------
   */

  const programmeSubjects =
    useMemo(() => {
      if (!selectedProgrammeId) {
        return data.subjects;
      }

      const usedSubjectIds =
        getSubjectIdsForProgramme(
          data.nodes,
          selectedProgrammeId
        );

      return data.subjects.filter(
        (subject) =>
          usedSubjectIds.has(
            subject.subject_id
          )
      );
    }, [
      data.nodes,
      data.subjects,
      selectedProgrammeId,
    ]);

  /*
   * --------------------------------------------------
   * Programme → Level synchronization
   * --------------------------------------------------
   */

  const availableLevels =
    useMemo(() => {
      if (!selectedProgrammeId) {
        return data.levels;
      }

      return data.levels.filter(
        (level) =>
          !level.programme_id ||
          level.programme_id ===
            selectedProgrammeId
      );
    }, [
      data.levels,
      selectedProgrammeId,
    ]);

  /*
   * --------------------------------------------------
   * Base programme + subject scope
   * --------------------------------------------------
   *
   * Level/search filtering is deliberately
   * applied AFTER this scope.
   */

  const scopedNodes =
    useMemo(() => {
      return data.nodes.filter(
        (node) => {
          if (
            selectedProgrammeId &&
            node.programme_id !==
              selectedProgrammeId
          ) {
            return false;
          }

          if (
            selectedSubjectId &&
            node.subject_id !==
              selectedSubjectId
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      data.nodes,
      selectedProgrammeId,
      selectedSubjectId,
    ]);

  /*
   * --------------------------------------------------
   * Hierarchy-preserving filtering
   * --------------------------------------------------
   *
   * This is the key v1.1 change.
   *
   * If:
   *
   * Area of Composite Figures
   *
   * matches STD4 or a search query, AEOS also
   * retains its Topic and Strand ancestors.
   *
   * We therefore never turn a Skill into a
   * fake top-level curriculum item simply
   * because its parents do not directly carry
   * a CLE / level relationship.
   */

  const filteredNodes =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      const hasLevelFilter =
        Boolean(selectedLevelId);

      const hasSearchFilter =
        Boolean(query);

      /*
       * No narrow filter:
       * preserve entire programme/subject
       * hierarchy.
       */

      if (
        !hasLevelFilter &&
        !hasSearchFilter
      ) {
        return scopedNodes;
      }

      const scopedIds = new Set(
        scopedNodes.map(
          (node) =>
            node.curriculum_node_id
        )
      );

      /*
       * Direct matches.
       */

      const directMatches =
        scopedNodes.filter(
          (node) => {
            if (
              hasLevelFilter
            ) {
              const levelIds =
                node.level_ids ?? [];

              if (
                !levelIds.includes(
                  selectedLevelId
                )
              ) {
                return false;
              }
            }

            if (
              hasSearchFilter
            ) {
              const searchable = [
                node.curriculum_node_id,
                node.node_name,
                node.node_type,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              if (
                !searchable.includes(
                  query
                )
              ) {
                return false;
              }
            }

            return true;
          }
        );

      const visibleIds =
        new Set();

      directMatches.forEach(
        (node) => {
          visibleIds.add(
            node.curriculum_node_id
          );

          /*
           * Walk upward through canonical
           * parent_node_id relationships.
           */

          let current = node;

          const visited =
            new Set();

          while (
            current?.parent_node_id &&
            !visited.has(
              current.parent_node_id
            )
          ) {
            visited.add(
              current.parent_node_id
            );

            const parent =
              allNodeMap.get(
                current.parent_node_id
              );

            if (!parent) {
              break;
            }

            /*
             * Do not allow filtering to escape
             * the programme/subject scope.
             */

            if (
              !scopedIds.has(
                parent.curriculum_node_id
              )
            ) {
              break;
            }

            visibleIds.add(
              parent.curriculum_node_id
            );

            current = parent;
          }
        }
      );

      return scopedNodes.filter(
        (node) =>
          visibleIds.has(
            node.curriculum_node_id
          )
      );
    }, [
      scopedNodes,
      selectedLevelId,
      search,
      allNodeMap,
    ]);

  /*
   * --------------------------------------------------
   * Tree construction
   * --------------------------------------------------
   */

  const nodeMap = useMemo(() => {
    const map = new Map();

    filteredNodes.forEach(
      (node) => {
        map.set(
          node.curriculum_node_id,
          {
            ...node,
            children: [],
          }
        );
      }
    );

    map.forEach((node) => {
      if (
        node.parent_node_id &&
        map.has(
          node.parent_node_id
        )
      ) {
        map
          .get(
            node.parent_node_id
          )
          .children.push(
            node
          );
      }
    });

    map.forEach((node) => {
      node.children.sort(
        compareCurriculumNodes
      );
    });

    return map;
  }, [filteredNodes]);

  const rootNodes = useMemo(() => {
    return Array.from(
      nodeMap.values()
    )
      .filter(
        (node) =>
          !node.parent_node_id ||
          !nodeMap.has(
            node.parent_node_id
          )
      )
      .sort(
        compareCurriculumNodes
      );
  }, [nodeMap]);

  /*
   * --------------------------------------------------
   * Canonical selected-node path
   * --------------------------------------------------
   */

  const selectedNodePath =
    useMemo(() => {
      if (!selectedNodeId) {
        return [];
      }

      return buildNodePath(
        selectedNodeId,
        allNodeMap
      );
    }, [
      selectedNodeId,
      allNodeMap,
    ]);

  /*
   * Ancestors to automatically expand.
   */

  const expandedNodeIds =
    useMemo(() => {
      const ids = new Set();

      selectedNodePath.forEach(
        (node) => {
          ids.add(
            node.curriculum_node_id
          );
        }
      );

      return ids;
    }, [selectedNodePath]);

  /*
   * If search/filtering hides the selected
   * node entirely, clear the detail panel.
   *
   * Programme/subject/level changes already
   * clear selection explicitly; this mainly
   * handles live search.
   */

  useEffect(() => {
    if (!selectedNodeId) {
      return;
    }

    if (loading) {
      return;
    }

    const visible =
      filteredNodes.some(
        (node) =>
          node.curriculum_node_id ===
          selectedNodeId
      );

    if (!visible) {
      setSelectedNodeId("");
      setSelectedNodeDetail(
        null
      );
    }
  }, [
    filteredNodes,
    selectedNodeId,
    loading,
  ]);

  /*
   * --------------------------------------------------
   * Node selection
   * --------------------------------------------------
   */

  async function handleSelectNode(
    nodeId
  ) {
    try {
      setSelectedNodeId(
        nodeId
      );

      setDetailLoading(true);
      setError("");

      const detail =
        await fetchCurriculumNodeDetail(
          nodeId
        );

      setSelectedNodeDetail(
        detail
      );
    } catch (err) {
      console.error(err);

      setSelectedNodeDetail(
        null
      );

      setError(
        err?.message ||
          "AEOS could not load this curriculum node."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function resetSelection() {
    setSelectedNodeId("");
    setSelectedNodeDetail(
      null
    );
  }

  /*
   * --------------------------------------------------
   * Filter handlers
   * --------------------------------------------------
   */

  function handleProgrammeChange(
    event
  ) {
    const programmeId =
      event.target.value;

    setSelectedProgrammeId(
      programmeId
    );

    /*
     * Automatically move Subject to a valid
     * subject within the newly selected
     * programme.
     */

    const subjectIds =
      getSubjectIdsForProgramme(
        data.nodes,
        programmeId
      );

    if (
      !subjectIds.has(
        selectedSubjectId
      )
    ) {
      const nextSubject =
        data.subjects.find(
          (subject) =>
            subjectIds.has(
              subject.subject_id
            )
        );

      setSelectedSubjectId(
        nextSubject?.subject_id ??
          ""
      );
    }

    /*
     * Preserve level only when it belongs
     * to the selected programme.
     */

    if (
      selectedLevelId
    ) {
      const levelStillValid =
        data.levels.some(
          (level) =>
            level.level_id ===
              selectedLevelId &&
            (
              !level.programme_id ||
              level.programme_id ===
                programmeId
            )
        );

      if (!levelStillValid) {
        setSelectedLevelId("");
      }
    }

    resetSelection();
  }

  function handleSubjectChange(
    event
  ) {
    setSelectedSubjectId(
      event.target.value
    );

    resetSelection();
  }

  function handleLevelChange(
    event
  ) {
    setSelectedLevelId(
      event.target.value
    );

    resetSelection();
  }

  function handleSearchChange(
    event
  ) {
    setSearch(
      event.target.value
    );
  }

  function clearFilters() {
    const firstProgramme =
      data.programmes?.[0]
        ?.programme_id ?? "";

    const subjectIds =
      getSubjectIdsForProgramme(
        data.nodes,
        firstProgramme
      );

    const firstSubject =
      data.subjects.find(
        (subject) =>
          subjectIds.has(
            subject.subject_id
          )
      )?.subject_id ?? "";

    setSelectedProgrammeId(
      firstProgramme
    );

    setSelectedSubjectId(
      firstSubject
    );

    setSelectedLevelId("");
    setSearch("");

    resetSelection();
  }

  /*
   * --------------------------------------------------
   * Render
   * --------------------------------------------------
   */

  if (loading) {
    return (
      <div className="curriculum-page">
        <div className="portal-card">
          <p>
            Loading AEOS Curriculum...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="curriculum-page">
      <header className="curriculum-page-heading">
        <div>
          <p className="curriculum-eyebrow">
            AEOS Curriculum
          </p>

          <h1>Curriculum</h1>

          <p>
            Browse the canonical curriculum,
            Learning Nodes, level expectations
            and instructional scope used across
            AEOS.
          </p>
        </div>

        <div className="curriculum-heading-stats">
          <CurriculumStat
            value={
              filteredNodes.length
            }
            label="Visible Nodes"
          />

          <CurriculumStat
            value={
              data.programmes.length
            }
            label="Programmes"
          />
        </div>
      </header>

      {error ? (
        <div className="portal-alert error">
          <strong>
            Curriculum error
          </strong>

          <p>{error}</p>
        </div>
      ) : null}

      <section className="portal-card curriculum-filters">
        <div className="curriculum-filter-field">
          <label htmlFor="curriculum-programme">
            Programme
          </label>

          <select
            id="curriculum-programme"
            value={
              selectedProgrammeId
            }
            onChange={
              handleProgrammeChange
            }
          >
            <option value="">
              All programmes
            </option>

            {data.programmes.map(
              (programme) => (
                <option
                  key={
                    programme.programme_id
                  }
                  value={
                    programme.programme_id
                  }
                >
                  {
                    programme.programme_name
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div className="curriculum-filter-field">
          <label htmlFor="curriculum-subject">
            Subject
          </label>

          <select
            id="curriculum-subject"
            value={
              selectedSubjectId
            }
            onChange={
              handleSubjectChange
            }
          >
            <option value="">
              All subjects
            </option>

            {programmeSubjects.map(
              (subject) => (
                <option
                  key={
                    subject.subject_id
                  }
                  value={
                    subject.subject_id
                  }
                >
                  {subject.display_name ||
                    subject.subject_name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="curriculum-filter-field">
          <label htmlFor="curriculum-level">
            Level
          </label>

          <select
            id="curriculum-level"
            value={
              selectedLevelId
            }
            onChange={
              handleLevelChange
            }
          >
            <option value="">
              All levels
            </option>

            {availableLevels.map(
              (level) => (
                <option
                  key={
                    level.level_id
                  }
                  value={
                    level.level_id
                  }
                >
                  {level.level_name ||
                    level.level_id}
                </option>
              )
            )}
          </select>
        </div>

        <div className="curriculum-filter-field curriculum-search-field">
          <label htmlFor="curriculum-search">
            Search
          </label>

          <input
            id="curriculum-search"
            type="search"
            value={search}
            placeholder="Search curriculum..."
            onChange={
              handleSearchChange
            }
          />
        </div>

        {(selectedLevelId ||
          search) && (
          <div className="curriculum-filter-actions">
            <button
              type="button"
              className="curriculum-clear-filter"
              onClick={
                clearFilters
              }
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <div className="curriculum-workspace">
        <section className="portal-card curriculum-browser">
          <div className="curriculum-section-heading">
            <div>
              <h2>
                Curriculum Structure
              </h2>

              <p>
                Strand → Topic → Skill
              </p>
            </div>

            <span>
              {
                filteredNodes.length
              }{" "}
              nodes
            </span>
          </div>

          {filteredNodes.length ===
          0 ? (
            <div className="curriculum-empty">
              <strong>
                No curriculum nodes
                found.
              </strong>

              <p>
                Try changing the
                programme, subject,
                level or search filter.
              </p>
            </div>
          ) : (
            <div className="curriculum-tree">
              {rootNodes.map(
                (root) => (
                  <CurriculumTreeNode
                    key={
                      root.curriculum_node_id
                    }
                    node={root}
                    selectedNodeId={
                      selectedNodeId
                    }
                    expandedNodeIds={
                      expandedNodeIds
                    }
                    onSelect={
                      handleSelectNode
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        <section className="portal-card curriculum-detail-panel">
          {!selectedNodeId ? (
            <div className="curriculum-detail-empty">
              <div className="curriculum-detail-empty-icon">
                ◎
              </div>

              <h2>
                Select a curriculum
                item
              </h2>

              <p>
                Choose a strand, topic
                or skill to inspect its
                canonical AEOS
                definition.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="curriculum-detail-empty">
              <p>
                Loading curriculum
                detail...
              </p>
            </div>
          ) : selectedNodeDetail ? (
            <CurriculumDetail
              detail={
                selectedNodeDetail
              }
              path={
                selectedNodePath
              }
              onSelectNode={
                handleSelectNode
              }
            />
          ) : (
            <div className="curriculum-detail-empty">
              <p>
                No detail is available
                for this curriculum
                node.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/*
 * ==================================================
 * Curriculum tree
 * ==================================================
 */

function CurriculumTreeNode({
  node,
  selectedNodeId,
  expandedNodeIds,
  onSelect,
  depth = 0,
}) {
  const [open, setOpen] =
    useState(depth < 1);

  const hasChildren =
    node.children?.length > 0;

  const active =
    selectedNodeId ===
    node.curriculum_node_id;

  /*
   * Automatically open the ancestry of a
   * deep-linked / selected node.
   */

  useEffect(() => {
    if (
      hasChildren &&
      expandedNodeIds?.has(
        node.curriculum_node_id
      )
    ) {
      setOpen(true);
    }
  }, [
    hasChildren,
    expandedNodeIds,
    node.curriculum_node_id,
  ]);

  return (
    <div
      className="curriculum-tree-node"
      data-depth={depth}
    >
      <div
        className={`curriculum-tree-row ${
          active ? "active" : ""
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            className="curriculum-tree-toggle"
            aria-label={
              open
                ? "Collapse"
                : "Expand"
            }
            onClick={() =>
              setOpen(
                (value) =>
                  !value
              )
            }
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="curriculum-tree-toggle-placeholder" />
        )}

        <button
          type="button"
          className="curriculum-tree-select"
          onClick={() =>
            onSelect(
              node.curriculum_node_id
            )
          }
        >
          <span className="curriculum-node-type">
            {formatNodeType(
              node.node_type
            )}
          </span>

          <span className="curriculum-node-copy">
            <strong>
              {node.node_name}
            </strong>

            <small>
              {
                node.curriculum_node_id
              }
            </small>
          </span>
        </button>
      </div>

      {hasChildren &&
      open ? (
        <div className="curriculum-tree-children">
          {node.children.map(
            (child) => (
              <CurriculumTreeNode
                key={
                  child.curriculum_node_id
                }
                node={child}
                selectedNodeId={
                  selectedNodeId
                }
                expandedNodeIds={
                  expandedNodeIds
                }
                onSelect={
                  onSelect
                }
                depth={
                  depth + 1
                }
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

/*
 * ==================================================
 * Curriculum detail
 * ==================================================
 */

function CurriculumDetail({
  detail,
  path,
  onSelectNode,
}) {
  const node = detail.node;

  const learningNodes =
    detail.learningNodes ?? [];

  const expectations =
    detail.expectations ?? [];

  return (
    <div className="curriculum-detail">
      {path?.length > 1 ? (
        <CurriculumBreadcrumb
          path={path}
          onSelectNode={
            onSelectNode
          }
        />
      ) : null}

      <div className="curriculum-detail-heading">
        <div>
          <span className="curriculum-detail-type">
            {formatNodeType(
              node.node_type
            )}
          </span>

          <h2>
            {node.node_name}
          </h2>

          <p>
            {
              node.curriculum_node_id
            }
          </p>
        </div>

        <StatusPill
          status={
            node.status
          }
        />
      </div>

      <DetailGrid>
        <DetailField
          label="Programme"
          value={
            node.programme_name ||
            node.programme_id
          }
        />

        <DetailField
          label="Subject"
          value={
            node.subject_name ||
            node.subject_id
          }
        />

        <DetailField
          label="Framework"
          value={
            node.framework_name ||
            node.framework_id ||
            "—"
          }
        />

        <DetailField
          label="Sequence"
          value={
            node.sequence ?? "—"
          }
        />
      </DetailGrid>

      {expectations.length >
      0 ? (
        <DetailSection
          title="Curriculum Level Expectations"
          count={
            expectations.length
          }
        >
          <div className="curriculum-expectation-list">
            {expectations.map(
              (expectation) => (
                <div
                  className="curriculum-expectation-card"
                  key={
                    expectation.curriculum_level_expectation_id
                  }
                >
                  <div className="curriculum-expectation-heading">
                    <strong>
                      {expectation.level_name ||
                        expectation.level_id}
                    </strong>

                    <StatusPill
                      status={
                        expectation.status
                      }
                    />
                  </div>

                  {expectation.expectation_text ? (
                    <p>
                      {
                        expectation.expectation_text
                      }
                    </p>
                  ) : null}

                  {expectation.content_constraints ? (
                    <div className="curriculum-detail-note">
                      <span>
                        Content
                        constraints
                      </span>

                      <p>
                        {
                          expectation.content_constraints
                        }
                      </p>
                    </div>
                  ) : null}

                  <div className="curriculum-expectation-meta">
                    {expectation.progression_status ? (
                      <span>
                        {
                          expectation.progression_status
                        }
                      </span>
                    ) : null}

                    {expectation.source_status ? (
                      <span>
                        {
                          expectation.source_status
                        }
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            )}
          </div>
        </DetailSection>
      ) : null}

      <DetailSection
        title="Learning Nodes"
        count={
          learningNodes.length
        }
      >
        {learningNodes.length ===
        0 ? (
          <div className="curriculum-detail-empty-inline">
            No canonical Learning
            Node is attached to this
            curriculum item.
          </div>
        ) : (
          <div className="curriculum-learning-node-list">
            {learningNodes.map(
              (learningNode) => (
                <LearningNodeCard
                  key={
                    learningNode.learning_node_id
                  }
                  learningNode={
                    learningNode
                  }
                />
              )
            )}
          </div>
        )}
      </DetailSection>

      {node.source_document ? (
        <DetailSection title="Source">
          <div className="curriculum-source-box">
            <strong>
              {
                node.source_document
              }
            </strong>
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

/*
 * ==================================================
 * Canonical breadcrumb
 * ==================================================
 */

function CurriculumBreadcrumb({
  path,
  onSelectNode,
}) {
  return (
    <nav
      className="curriculum-breadcrumb"
      aria-label="Curriculum path"
    >
      {path.map(
        (node, index) => {
          const isLast =
            index ===
            path.length - 1;

          return (
            <span
              key={
                node.curriculum_node_id
              }
              className="curriculum-breadcrumb-item"
            >
              {index > 0 ? (
                <span className="curriculum-breadcrumb-separator">
                  ›
                </span>
              ) : null}

              {isLast ? (
                <strong>
                  {
                    node.node_name
                  }
                </strong>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onSelectNode(
                      node.curriculum_node_id
                    )
                  }
                >
                  {
                    node.node_name
                  }
                </button>
              )}
            </span>
          );
        }
      )}
    </nav>
  );
}

/*
 * ==================================================
 * Learning Node
 * ==================================================
 */

function LearningNodeCard({
  learningNode,
}) {
  const levelExpectations =
    learningNode.level_expectations ??
    [];

  const levels =
    learningNode.levels ?? [];

  return (
    <article className="curriculum-learning-node-card">
      <div className="curriculum-learning-node-heading">
        <div>
          <span>
            Learning Node
          </span>

          <strong>
            {learningNode.source_label ||
              learningNode.learning_node_id}
          </strong>

          <small>
            {
              learningNode.learning_node_id
            }
          </small>
        </div>

        <StatusPill
          status={
            learningNode.status
          }
        />
      </div>

      {learningNode.observable_statement ? (
        <div className="curriculum-learning-node-statement">
          <span>
            Observable statement
          </span>

          <p>
            {
              learningNode.observable_statement
            }
          </p>
        </div>
      ) : null}

      {learningNode.learning_outcome ? (
        <div className="curriculum-learning-node-statement">
          <span>
            Learning outcome
          </span>

          <p>
            {
              learningNode.learning_outcome
            }
          </p>
        </div>
      ) : null}

      <div className="curriculum-learning-node-meta">
        <span>
          Observable:{" "}
          <strong>
            {learningNode.is_observable
              ? "Yes"
              : "No"}
          </strong>
        </span>

        {learningNode.mastery_threshold !=
        null ? (
          <span>
            Mastery threshold:{" "}
            <strong>
              {
                learningNode.mastery_threshold
              }
            </strong>
          </span>
        ) : null}

        {learningNode.normalisation_status ? (
          <span>
            Normalisation:{" "}
            <strong>
              {
                learningNode.normalisation_status
              }
            </strong>
          </span>
        ) : null}
      </div>

      {levels.length > 0 ? (
        <div className="curriculum-learning-node-levels">
          <span>
            Level relationships
          </span>

          <div className="curriculum-learning-node-level-pills">
            {levels.map(
              (level) => (
                <span
                  key={
                    level.learning_node_level_id
                  }
                  className="curriculum-learning-node-level-pill"
                >
                  {level.level_name ||
                    level.level_id}

                  {level.relationship_type
                    ? ` · ${formatRelationshipType(
                        level.relationship_type
                      )}`
                    : ""}
                </span>
              )
            )}
          </div>
        </div>
      ) : null}

      {levelExpectations.length >
      0 ? (
        <details className="curriculum-ln-expectations">
          <summary>
            Level expectations (
            {
              levelExpectations.length
            }
            )
          </summary>

          <div className="curriculum-ln-expectation-list">
            {levelExpectations.map(
              (expectation) => (
                <div
                  key={
                    expectation.learning_node_expectation_id
                  }
                  className="curriculum-ln-expectation"
                >
                  <div>
                    <strong>
                      {
                        expectation.source_level_code
                      }
                    </strong>

                    {expectation.progression_status ? (
                      <span>
                        {
                          expectation.progression_status
                        }
                      </span>
                    ) : null}
                  </div>

                  {expectation.mastery_expectation ? (
                    <p>
                      {
                        expectation.mastery_expectation
                      }
                    </p>
                  ) : (
                    <p className="muted">
                      No explicit mastery
                      expectation at this
                      level.
                    </p>
                  )}

                  {expectation.protection_scope_note ? (
                    <div className="curriculum-detail-note">
                      <span>
                        Scope note
                      </span>

                      <p>
                        {
                          expectation.protection_scope_note
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              )
            )}
          </div>
        </details>
      ) : null}
    </article>
  );
}

/*
 * ==================================================
 * Small UI components
 * ==================================================
 */

function DetailSection({
  title,
  count,
  children,
}) {
  return (
    <section className="curriculum-detail-section">
      <div className="curriculum-detail-section-heading">
        <h3>{title}</h3>

        {count != null ? (
          <span>
            {count}
          </span>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function DetailGrid({
  children,
}) {
  return (
    <div className="curriculum-detail-grid">
      {children}
    </div>
  );
}

function DetailField({
  label,
  value,
}) {
  return (
    <div className="curriculum-detail-field">
      <span>{label}</span>

      <strong>
        {value ?? "—"}
      </strong>
    </div>
  );
}

function CurriculumStat({
  value,
  label,
}) {
  return (
    <div className="curriculum-heading-stat">
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>
  );
}

function StatusPill({
  status,
}) {
  if (!status) {
    return null;
  }

  const className =
    String(status)
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      )
      .replaceAll(
        "_",
        "-"
      );

  return (
    <span
      className={`curriculum-status-pill ${className}`}
    >
      {status}
    </span>
  );
}

/*
 * ==================================================
 * Helpers
 * ==================================================
 */

function getSubjectIdsForProgramme(
  nodes,
  programmeId
) {
  if (!programmeId) {
    return new Set(
      nodes
        .map(
          (node) =>
            node.subject_id
        )
        .filter(Boolean)
    );
  }

  return new Set(
    nodes
      .filter(
        (node) =>
          node.programme_id ===
          programmeId
      )
      .map(
        (node) =>
          node.subject_id
      )
      .filter(Boolean)
  );
}

function buildNodePath(
  nodeId,
  nodeMap
) {
  const path = [];

  const visited =
    new Set();

  let current =
    nodeMap.get(
      nodeId
    );

  while (
    current &&
    !visited.has(
      current.curriculum_node_id
    )
  ) {
    visited.add(
      current.curriculum_node_id
    );

    path.unshift(
      current
    );

    if (
      !current.parent_node_id
    ) {
      break;
    }

    current =
      nodeMap.get(
        current.parent_node_id
      );
  }

  return path;
}

function formatNodeType(
  type
) {
  if (!type) {
    return "Node";
  }

  return String(type)
    .toLowerCase()
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function formatRelationshipType(
  type
) {
  if (!type) {
    return "";
  }

  return String(type)
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function compareCurriculumNodes(
  a,
  b
) {
  const aSequence =
    a.sequence ?? 999999;

  const bSequence =
    b.sequence ?? 999999;

  if (
    aSequence !==
    bSequence
  ) {
    return (
      aSequence -
      bSequence
    );
  }

  return String(
    a.node_name ?? ""
  ).localeCompare(
    String(
      b.node_name ?? ""
    )
  );
}

export default CurriculumPage;

