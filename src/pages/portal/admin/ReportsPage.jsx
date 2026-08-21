import { Link } from "react-router-dom";

import "../../../styles/reports.css";


export default function ReportsPage() {
  return (
    <>
      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Reports
          </p>

          <h2>
            AEOS Reports
          </h2>

          <p>
            Generate, review and
            manage reports from
            tutoring and Pen-E
            intelligence.
          </p>
        </div>
      </section>


      <section className="reports-navigation-grid">
        <Link
          to="/portal/admin/reports/students"
          className="reports-navigation-card"
        >
          <span className="reports-navigation-icon">
            S
          </span>

          <div>
            <h3>
              Student Reports
            </h3>

            <p>
              Generate term,
              annual and custom
              student reports.
            </p>
          </div>
        </Link>


        <article
          className="
            reports-navigation-card
            reports-navigation-card-disabled
          "
        >
          <span className="reports-navigation-icon">
            T
          </span>

          <div>
            <h3>
              Tutor Reports
            </h3>

            <p>
              Tutor reporting and
              instructional
              intelligence.
            </p>

            <small>
              Coming next
            </small>
          </div>
        </article>
      </section>
    </>
  );
}

