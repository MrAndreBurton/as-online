import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentLearning } from "../../../lib/studentLearning";

function skillName(skill) {
  return skill.skillName || skill.learningNodeName || skill.name || "Learning skill";
}

function strandName(skill) {
  return skill.strand?.name || skill.strandName || "Other";
}

function topicName(skill) {
  return skill.topic?.name || skill.topicName || "General";
}

function observableStatement(skill) {
  return skill.observableStatement || skill.learningOutcome || "";
}

function hasReviewedLearning(skill) {
  return Boolean(skill.hasRecordedProgress);
}

function evidenceCount(skill) {
  return Number(skill.approvedEvidenceCount || 0);
}

function buildHierarchy(skills) {
  const strands = new Map();

  for (const skill of skills) {
    const strand = strandName(skill);
    const topic = topicName(skill);
    const strandSequence = skill.strand?.sequence ?? 9999;
    const topicSequence = skill.topic?.sequence ?? 9999;

    if (!strands.has(strand)) {
      strands.set(strand, { strand, sequence: strandSequence, topics: new Map() });
    }

    const strandEntry = strands.get(strand);

    if (!strandEntry.topics.has(topic)) {
      strandEntry.topics.set(topic, {
        topic,
        sequence: topicSequence,
        skills: [],
      });
    }

    strandEntry.topics.get(topic).skills.push(skill);
  }

  return [...strands.values()]
    .sort((a, b) => a.sequence - b.sequence || a.strand.localeCompare(b.strand))
    .map((strand) => ({
      strand: strand.strand,
      topics: [...strand.topics.values()]
        .sort((a, b) => a.sequence - b.sequence || a.topic.localeCompare(b.topic))
        .map((topic) => ({
          ...topic,
          skills: [...topic.skills].sort((a, b) =>
            skillName(a).localeCompare(skillName(b))
          ),
        })),
    }));
}

function SkillRow({ skill }) {
  const reviewed = hasReviewedLearning(skill);
  const count = evidenceCount(skill);
  const statement = observableStatement(skill);

  return (
    <article
      className={`student-learning-map-skill ${
        reviewed ? "has-reviewed-learning" : "programme-skill"
      }`}
    >
      <span className="student-learning-map-marker" aria-hidden="true" />

      <div className="student-learning-map-skill-copy">
        <strong>{skillName(skill)}</strong>
        {statement ? <p>{statement}</p> : null}

        <span className="student-learning-map-skill-state">
          {reviewed ? (
            <>
              <b>Reviewed learning</b>
              <span>
                {count === 1
                  ? "1 approved learning moment"
                  : `${count} approved learning moments`}
              </span>
            </>
          ) : (
            <>
              <b>In your learning programme</b>
              <span>No learning claim is being made yet.</span>
            </>
          )}
        </span>
      </div>

      {reviewed ? (
        <Link to="/portal/student/pen-e">See in Pen-E &amp; Me →</Link>
      ) : null}
    </article>
  );
}

function TopicPanel({ topic }) {
  const [open, setOpen] = useState(false);
  const reviewedCount = topic.skills.filter(hasReviewedLearning).length;

  return (
    <div className="student-learning-map-topic">
      <button
        type="button"
        className="student-learning-map-topic-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div>
          <strong>{topic.topic}</strong>
          <span>
            {topic.skills.length} {topic.skills.length === 1 ? "skill" : "skills"}
          </span>
        </div>

        <div className="student-learning-map-topic-meta">
          {reviewedCount ? (
            <span>{reviewedCount} with reviewed learning</span>
          ) : (
            <span>Part of your programme</span>
          )}
          <b aria-hidden="true">{open ? "−" : "+"}</b>
        </div>
      </button>

      {open ? (
        <div className="student-learning-map-topic-skills">
          {topic.skills.map((skill) => (
            <SkillRow key={skill.learningNodeId} skill={skill} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StrandView({ strand, onBack }) {
  const skills = strand.topics.flatMap((topic) => topic.skills);
  const reviewedCount = skills.filter(hasReviewedLearning).length;

  return (
    <div className="student-learning-landscape">
      <button
        type="button"
        className="student-learning-map-back"
        onClick={onBack}
      >
        ← Learning Map
      </button>

      <section className="student-learning-strand-hero">
        <span className="student-learning-map-kicker">Learning area</span>
        <h2>{strand.strand}</h2>
        <p>
          {strand.topics.length} {strand.topics.length === 1 ? "topic" : "topics"} ·{" "}
          {skills.length} {skills.length === 1 ? "skill" : "skills"}
        </p>

        <div className="student-learning-reviewed-note">
          <span className="student-learning-reviewed-dot" />
          <div>
            <strong>
              {reviewedCount
                ? `Reviewed learning exists in ${reviewedCount} ${
                    reviewedCount === 1 ? "skill" : "skills"
                  }.`
                : "No reviewed learning is attached here yet."}
            </strong>
            <p>
              Skills without reviewed evidence are still part of your learning
              programme. They are not being marked as weak or incomplete.
            </p>
          </div>
        </div>
      </section>

      <section className="student-learning-map-topics">
        {strand.topics.map((topic) => (
          <TopicPanel key={`${strand.strand}-${topic.topic}`} topic={topic} />
        ))}
      </section>
    </div>
  );
}

function StrandCard({ strand, onOpen }) {
  const skills = strand.topics.flatMap((topic) => topic.skills);
  const reviewedCount = skills.filter(hasReviewedLearning).length;

  return (
    <button
      type="button"
      className="student-learning-landscape-card"
      onClick={onOpen}
    >
      <div className="student-learning-landscape-card-top">
        <span className="student-learning-landscape-letter">
          {strand.strand.trim().charAt(0).toUpperCase()}
        </span>
        {reviewedCount ? (
          <span className="student-learning-reviewed-pill">
            {reviewedCount} reviewed
          </span>
        ) : null}
      </div>

      <div>
        <h3>{strand.strand}</h3>
        <p>
          {strand.topics.length} {strand.topics.length === 1 ? "topic" : "topics"} ·{" "}
          {skills.length} {skills.length === 1 ? "skill" : "skills"}
        </p>
      </div>

      <div className="student-learning-landscape-card-footer">
        <span>
          {reviewedCount
            ? `${reviewedCount} with reviewed learning`
            : "Explore your programme"}
        </span>
        <b>Explore →</b>
      </div>
    </button>
  );
}

function OfferingLearning({ enrolment }) {
  const [selectedStrand, setSelectedStrand] = useState(null);
  const skills = enrolment.skills ?? [];
  const hierarchy = useMemo(() => buildHierarchy(skills), [skills]);
  const reviewedCount = skills.filter(hasReviewedLearning).length;

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

  const levelLabel = (enrolment.curriculumLevels ?? [])
    .map((level) => level.levelName || level.levelId)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="student-learning-landscape">
      <section className="student-learning-programme-hero">
        <div>
          <span className="student-learning-map-kicker">
            {enrolment.subjectName || "My Learning"}
          </span>
          <h2>{enrolment.offeringName || enrolment.subjectName || "My Learning"}</h2>
          {levelLabel ? <p>{levelLabel}</p> : null}
        </div>

        <div className="student-learning-programme-stat">
          <strong>{skills.length}</strong>
          <span>skills in this learning programme</span>
        </div>
      </section>

      <section className="student-learning-map-explainer">
        <div>
          <span className="student-learning-reviewed-dot" />
          <div>
            <strong>
              {reviewedCount
                ? `${reviewedCount} ${
                    reviewedCount === 1 ? "skill has" : "skills have"
                  } reviewed learning.`
                : "Your learning map is ready."}
            </strong>
            <p>
              Reviewed learning means approved evidence exists from your
              sessions. Everything else remains neutral until there is evidence
              to show.
            </p>
          </div>
        </div>

        {reviewedCount ? (
          <Link to="/portal/student/pen-e">Open Pen-E &amp; Me →</Link>
        ) : null}
      </section>

      <section className="student-learning-map-section">
        <div className="student-learning-map-heading">
          <div>
            <span className="student-learning-map-kicker">Your learning map</span>
            <h2>Explore by learning area</h2>
          </div>
          <span>{hierarchy.length} learning areas</span>
        </div>

        <div className="student-learning-landscape-grid">
          {hierarchy.map((strand) => (
            <StrandCard
              key={strand.strand}
              strand={strand}
              onOpen={() => setSelectedStrand(strand.strand)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function StudentLearningPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setError("");

    fetchStudentLearning(user.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Unable to load your learning.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (error) return <div className="portal-alert">{error}</div>;
  if (!data) return <div className="portal-loading">Loading your learning…</div>;

  const enrolments = data.enrolments ?? [];

  return (
    <div className="student-learning-page-v1">
      <section className="student-learning-page-hero">
        <span className="student-learning-map-kicker">My Learning</span>
        <h2>Your learning landscape.</h2>
        <p>
          See the full picture of what you&apos;re learning and where your
          reviewed sessions have already left evidence.
        </p>

        <div className="student-learning-page-key">
          <span><i className="reviewed" /> Reviewed learning</span>
          <span><i className="programme" /> In your programme</span>
        </div>
      </section>

      {enrolments.length ? (
        enrolments.map((enrolment) => (
          <OfferingLearning
            key={enrolment.enrolmentId}
            enrolment={enrolment}
          />
        ))
      ) : (
        <section className="student-learning-no-programme">
          <strong>No active learning programme</strong>
          <p>
            Your learning landscape will appear here when an active enrolment
            is available.
          </p>
        </section>
      )}

      <footer className="student-learning-trust-note">
        <strong>Your map is evidence-aware, not a scorecard.</strong>
        <span>
          A skill without reviewed evidence is not being labelled as weak,
          incomplete, or not understood.
        </span>
      </footer>
    </div>
  );
}



