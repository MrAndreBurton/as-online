import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentLearning } from "../../../lib/studentLearning";

function skillName(skill) {
  return (
    skill.skillName ||
    skill.learningNodeName ||
    skill.learning_node_name ||
    skill.nodeName ||
    skill.node_name ||
    skill.name ||
    "Learning skill"
  );
}

function strandName(skill) {
  return (
    skill.strandName ||
    skill.strand_name ||
    skill.strand?.nodeName ||
    skill.strand?.node_name ||
    skill.strand?.name ||
    "Other"
  );
}

function topicName(skill) {
  return (
    skill.topicName ||
    skill.topic_name ||
    skill.topic?.nodeName ||
    skill.topic?.node_name ||
    skill.topic?.name ||
    "General"
  );
}

function observableStatement(skill) {
  return (
    skill.observableStatement ||
    skill.observable_statement ||
    skill.learningOutcome ||
    skill.learning_outcome ||
    ""
  );
}

function hasRecordedProgress(skill) {
  return Boolean(skill.hasRecordedProgress);
}

function progressLabel(skill) {
  return hasRecordedProgress(skill)
    ? "Progress recorded"
    : "No progress recorded yet";
}

function buildHierarchy(skills) {
  const strands = new Map();

  for (const skill of skills) {
    const strand = strandName(skill);
    const topic = topicName(skill);

    if (!strands.has(strand)) {
      strands.set(strand, new Map());
    }

    if (!strands.get(strand).has(topic)) {
      strands.get(strand).set(topic, []);
    }

    strands.get(strand).get(topic).push(skill);
  }

  return [...strands.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([strand, topics]) => ({
      strand,
      topics: [...topics.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([topic, topicSkills]) => ({
          topic,
          skills: [...topicSkills].sort((a, b) =>
            skillName(a).localeCompare(skillName(b))
          ),
        })),
    }));
}

function SkillCard({ skill }) {
  const statement = observableStatement(skill);
  const hasProgress = hasRecordedProgress(skill);

  return (
    <article className="student-skill-card">
      <div>
        <strong>{skillName(skill)}</strong>

        {statement ? <p>{statement}</p> : null}
      </div>

      <span
        className={`student-skill-status ${
          hasProgress ? "has-progress" : "not-started"
        }`}
      >
        {progressLabel(skill)}
      </span>
    </article>
  );
}

function TopicPanel({ topic }) {
  const [open, setOpen] = useState(false);

  const progressCount = topic.skills.filter(
    hasRecordedProgress
  ).length;

  return (
    <div className="student-topic-card">
      <button
        type="button"
        className="student-topic-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div>
          <strong>{topic.topic}</strong>
          <span>
            {topic.skills.length}{" "}
            {topic.skills.length === 1 ? "skill" : "skills"}
          </span>
        </div>

        <span className="student-topic-meta">
          {progressCount > 0
            ? `${progressCount} with progress`
            : "Explore"}

          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </span>
      </button>

      {open ? (
        <div className="student-topic-skills">
          {topic.skills.map((skill, index) => (
            <SkillCard
              key={
                skill.learningNodeId ||
                skill.learning_node_id ||
                `${topic.topic}-${index}`
              }
              skill={skill}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StrandView({ strand, onBack }) {
  const skillCount = strand.topics.reduce(
    (total, topic) => total + topic.skills.length,
    0
  );

  return (
    <section className="portal-card student-strand-view">
      <button
        type="button"
        className="student-learning-back"
        onClick={onBack}
      >
        ← Back to learning areas
      </button>

      <div className="student-strand-heading">
        <div>
          <p className="portal-eyebrow">Learning Area</p>
          <h2>{strand.strand}</h2>
          <p>
            Choose a topic to see the skills you will work on.
          </p>
        </div>

        <div className="student-strand-count">
          <strong>{skillCount}</strong>
          <span>{skillCount === 1 ? "skill" : "skills"}</span>
        </div>
      </div>

      <div className="student-topic-list">
        {strand.topics.map((topic) => (
          <TopicPanel
            key={`${strand.strand}-${topic.topic}`}
            topic={topic}
          />
        ))}
      </div>
    </section>
  );
}

function OfferingLearning({ enrolment }) {
  const [selectedStrand, setSelectedStrand] = useState(null);

  const skills = enrolment.skills ?? [];

  const hierarchy = useMemo(
    () => buildHierarchy(skills),
    [skills]
  );

  const progressSkills = skills.filter(
    hasRecordedProgress
  );

  const progressCount = progressSkills.length;

  const selected = hierarchy.find(
    (strand) => strand.strand === selectedStrand
  );

  if (selected) {
    return (
      <StrandView
        strand={selected}
        onBack={() => setSelectedStrand(null)}
      />
    );
  }

  return (
    <>
      <section className="portal-card student-learning-overview">
        <div>
          <p className="portal-eyebrow">
            {enrolment.subjectName || "My Learning"}
          </p>

          <h2>
            {enrolment.offeringName ||
              enrolment.subjectName ||
              "My Learning"}
          </h2>

          {enrolment.curriculumLevels?.length ? (
            <p className="student-learning-level">
              {enrolment.curriculumLevels
                .map(
                  (level) =>
                    level.levelName ||
                    level.level_name ||
                    level.levelId
                )
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : null}
        </div>

        <div className="student-learning-programme-summary">
          <strong>{skills.length}</strong>
          <span>skills in your programme</span>
        </div>
      </section>

      {progressCount === 0 ? (
        <section className="student-learning-message">
          <strong>Your learning journey starts here.</strong>

          <p>
            Your progress will appear as you complete sessions
            and learning activities.
          </p>
        </section>
      ) : (
        <section className="student-learning-message">
          <strong>
            You have progress recorded in {progressCount}{" "}
            {progressCount === 1 ? "skill" : "skills"}.
          </strong>

          <p>
            Keep working through your learning areas to build
            your progress.
          </p>

          <details className="student-progress-details">
            <summary>
              View {progressCount}{" "}
              {progressCount === 1 ? "skill" : "skills"}
            </summary>

            <ul className="student-progress-skill-list">
              {progressSkills.map((skill, index) => (
                <li
                  key={
                    skill.learningNodeId ||
                    skill.learning_node_id ||
                    `progress-skill-${index}`
                  }
                >
                  {skillName(skill)}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <section>
        <div className="student-learning-section-heading">
          <div>
            <p className="portal-eyebrow">Explore</p>
            <h2>Choose a learning area</h2>
          </div>
        </div>

        <div className="student-strand-grid">
          {hierarchy.map((strand) => {
            const count = strand.topics.reduce(
              (total, topic) =>
                total + topic.skills.length,
              0
            );

            const strandProgressCount = strand.topics
              .flatMap((topic) => topic.skills)
              .filter(hasRecordedProgress)
              .length;

            return (
              <button
                type="button"
                className="student-strand-card"
                key={strand.strand}
                onClick={() =>
                  setSelectedStrand(strand.strand)
                }
              >
                <div>
                  <span className="student-strand-icon">
                    {strand.strand
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <h3>{strand.strand}</h3>

                  <p>
                    {strand.topics.length}{" "}
                    {strand.topics.length === 1
                      ? "topic"
                      : "topics"}
                  </p>
                </div>

                <div className="student-strand-card-footer">
                  <span>
                    {count}{" "}
                    {count === 1 ? "skill" : "skills"}
                  </span>

                  <span>
                    {strandProgressCount > 0
                      ? `${strandProgressCount} started`
                      : "Explore →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default function StudentLearningPage() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    fetchStudentLearning(user.id)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load your learning."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (error) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="portal-loading">
        Loading your learning…
      </div>
    );
  }

  const enrolments = data.enrolments ?? [];

  return (
    <>
      <section className="portal-welcome">
        <p className="portal-eyebrow">
          My Learning
        </p>

        <h2>What are you learning?</h2>

        <p>
          Explore your learning areas, open a topic and see the
          skills you are building.
        </p>
      </section>

      {enrolments.length ? (
        enrolments.map((enrolment) => (
          <OfferingLearning
            key={enrolment.enrolmentId}
            enrolment={enrolment}
          />
        ))
      ) : (
        <section className="portal-card">
          <h3>No active learning programme</h3>

          <p>
            Your learning programme will appear here when an
            active enrolment is available.
          </p>
        </section>
      )}
    </>
  );
}

