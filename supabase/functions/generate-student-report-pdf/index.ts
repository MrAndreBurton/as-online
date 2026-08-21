import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "https://esm.sh/pdf-lib@1.17.1";


// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",

  "Access-Control-Expose-Headers":
    "Content-Disposition",
};


// ============================================================
// PDF CONTRACT
// ============================================================

type PdfPayload = {
  contract_version: string;

  internal: {
    report_id: string;
    report_ref: string;
  };

  report: {
    report_ref: string;
    report_type: string;
    report_title: string | null;
    period_start: string;
    period_end: string;
    finalized_at: string;
  };

  student: {
    display_name: string;
    first_name?: string | null;
    last_name?: string | null;
    school?: string | null;
  };

  offerings: Array<{
    offering_name: string | null;
  }>;

  tutors: Array<{
    display_name: string | null;
    title?: string | null;
  }>;

  activity: {
    completed_sessions: number;
    hours_tutored: number;

    attendance: {
      present: number;
      absent: number;
      late: number;
      excused: number;
      other_or_unknown: number;

      attendance_percent:
        | number
        | null;
    };
  };

  content: {
    report_version: string;

    overview: {
      headline: string;
      summary: string;
    };

    learning_highlights: string[];

    areas_for_development: string[];

    follow_up_priorities: string[];

    curriculum_progress: string[];

    closing_comment: string;
  };
};


// ============================================================
// RESPONSE HELPERS
// ============================================================

function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json",
      },
    }
  );
}


// ============================================================
// TEXT HELPERS
// ============================================================

function cleanText(
  value: unknown
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}


function safeFilenamePart(
  value: string
) {
  return cleanText(value)
    .replace(
      /[^a-z0-9]+/gi,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


// ============================================================
// DATE HELPERS
// ============================================================

function asUtcDate(
  value: string
) {
  return new Date(
    value.length === 10
      ? `${value}T12:00:00Z`
      : value
  );
}


function formatDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-TT",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }
  ).format(
    asUtcDate(value)
  );
}


function shortMonth(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-TT",
    {
      month: "short",
      timeZone: "UTC",
    }
  ).format(
    asUtcDate(value)
  );
}


function dateYear(
  value: string
) {
  return asUtcDate(
    value
  ).getUTCFullYear();
}


function buildReportPeriodLabel(
  start: string,
  end: string
) {
  const startMonth =
    shortMonth(start);

  const endMonth =
    shortMonth(end);

  const startYear =
    dateYear(start);

  const endYear =
    dateYear(end);


  if (
    startMonth === endMonth &&
    startYear === endYear
  ) {
    return `${startMonth}-${startYear}`;
  }


  if (
    startYear === endYear
  ) {
    return `${startMonth}-${endMonth}-${startYear}`;
  }


  return `${startMonth}-${startYear}-${endMonth}-${endYear}`;
}


// ============================================================
// TEXT WRAPPING
// ============================================================

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
) {
  const cleaned =
    cleanText(text);

  if (!cleaned) {
    return [];
  }

  const words =
    cleaned.split(" ");

  const lines:
    string[] = [];

  let currentLine =
    "";

  for (
    const word of words
  ) {
    const candidate =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        candidate,
        fontSize
      );

    if (
      width <= maxWidth ||
      !currentLine
    ) {
      currentLine =
        candidate;

      continue;
    }

    lines.push(
      currentLine
    );

    currentLine =
      word;
  }

  if (currentLine) {
    lines.push(
      currentLine
    );
  }

  return lines;
}


// ============================================================
// MAIN EDGE FUNCTION
// ============================================================

Deno.serve(
  async (req) => {

    // --------------------------------------------------------
    // CORS PREFLIGHT
    // --------------------------------------------------------

    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }


    // --------------------------------------------------------
    // METHOD
    // --------------------------------------------------------

    if (
      req.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          error:
            "Method not allowed",
        },
        405
      );
    }


    try {

      // ======================================================
      // AUTHENTICATION
      // ======================================================

      const authorization =
        req.headers.get(
          "Authorization"
        );


      if (!authorization) {
        return jsonResponse(
          {
            error:
              "Authorization required",
          },
          401
        );
      }


      // ======================================================
      // REQUEST BODY
      // ======================================================

      let body:
        {
          report_id?: string;
        };


      try {
        body =
          await req.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body",
          },
          400
        );
      }


      const reportId =
        body?.report_id;


      if (!reportId) {
        return jsonResponse(
          {
            error:
              "report_id is required",
          },
          400
        );
      }


      // ======================================================
      // SUPABASE CLIENT
      // ======================================================

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL"
        );

      const supabaseAnonKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY"
        );


      if (
        !supabaseUrl ||
        !supabaseAnonKey
      ) {
        throw new Error(
          "Supabase environment is not configured."
        );
      }


      /*
       * We deliberately forward the caller's JWT.
       *
       * The database remains authoritative for:
       *
       * - admin/tutor access
       * - finalized status
       * - PDF readiness
       * - safe renderer contract
       */

      const supabase =
        createClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            global: {
              headers: {
                Authorization:
                  authorization,
              },
            },

            auth: {
              persistSession:
                false,

              autoRefreshToken:
                false,
            },
          }
        );


      // ======================================================
      // VERIFY CALLER
      // ======================================================

      const {
        data:
          userData,

        error:
          userError,
      } =
        await supabase
          .auth
          .getUser();


      if (
        userError ||
        !userData?.user
      ) {
        return jsonResponse(
          {
            error:
              "Invalid authentication",
          },
          401
        );
      }


      // ======================================================
      // GET SAFE PDF PAYLOAD
      // ======================================================

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "aeos_get_student_report_pdf_payload",
          {
            p_report_id:
              reportId,
          }
        );


      if (error) {
        return jsonResponse(
          {
            error:
              error.message,
          },
          400
        );
      }


      const payload =
        data as PdfPayload;


      if (
        !payload ||
        payload.contract_version !==
          "student-report-pdf-v1"
      ) {
        throw new Error(
          "Unsupported student report PDF contract."
        );
      }


      // ======================================================
      // PDF SETUP
      // ======================================================

      const pdf =
        await PDFDocument.create();


      const regular =
        await pdf.embedFont(
          StandardFonts
            .Helvetica
        );


      const bold =
        await pdf.embedFont(
          StandardFonts
            .HelveticaBold
        );


      // ======================================================
      // PAGE CONSTANTS
      // A4 portrait
      // ======================================================

      const PAGE_WIDTH =
        595.28;

      const PAGE_HEIGHT =
        841.89;

      const MARGIN_X =
        52;

      const TOP_MARGIN =
        48;

      const BOTTOM_CONTENT_Y =
        68;

      const CONTENT_WIDTH =
        PAGE_WIDTH -
        MARGIN_X * 2;


      // ======================================================
      // BRAND COLOURS
      // ======================================================

      const NAVY =
        rgb(
          20 / 255,
          48 / 255,
          73 / 255
        );

      const BLUE =
        rgb(
          31 / 255,
          96 / 255,
          145 / 255
        );

      const GOLD =
        rgb(
          197 / 255,
          153 / 255,
          55 / 255
        );

      const TEXT =
        rgb(
          42 / 255,
          50 / 255,
          56 / 255
        );

      const MUTED =
        rgb(
          105 / 255,
          116 / 255,
          126 / 255
        );

      const LIGHT =
        rgb(
          246 / 255,
          248 / 255,
          250 / 255
        );

      const BORDER =
        rgb(
          224 / 255,
          229 / 255,
          233 / 255
        );


      // ======================================================
      // LOAD A'S ONLINE LOGO
      // ======================================================

      let logo:
        any =
        null;


      try {
        const logoUrl =
          new URL(
            "./assets/favicon.png",
            import.meta.url
          );


        const logoBytes =
          await Deno.readFile(
            logoUrl
          );


        logo =
          await pdf.embedPng(
            logoBytes
          );

      } catch (
        logoError
      ) {
        console.warn(
          "PDF logo unavailable:",
          logoError
        );
      }


      // ======================================================
      // PAGE STATE
      // ======================================================

      let page:
        any;


      let pageNumber =
        0;


      let y =
        0;


      // ======================================================
      // FOOTER
      // ======================================================

      function drawFooter() {

        const lineY =
          44;

        const textY =
          27;


        page.drawLine({
          start: {
            x:
              MARGIN_X,

            y:
              lineY,
          },

          end: {
            x:
              PAGE_WIDTH -
              MARGIN_X,

            y:
              lineY,
          },

          thickness:
            0.6,

          color:
            BORDER,
        });


        const leftText =
          "A's Online Tutoring Services";


        page.drawText(
          leftText,
          {
            x:
              MARGIN_X,

            y:
              textY,

            size:
              7.5,

            font:
              regular,

            color:
              MUTED,
          }
        );


        const centerText =
          `Report Ref: ${payload.report.report_ref}`;


        const centerWidth =
          regular
            .widthOfTextAtSize(
              centerText,
              7.5
            );


        page.drawText(
          centerText,
          {
            x:
              (
                PAGE_WIDTH -
                centerWidth
              ) /
              2,

            y:
              textY,

            size:
              7.5,

            font:
              regular,

            color:
              MUTED,
          }
        );


        const rightText =
          `Page ${pageNumber}`;


        const rightWidth =
          regular
            .widthOfTextAtSize(
              rightText,
              7.5
            );


        page.drawText(
          rightText,
          {
            x:
              PAGE_WIDTH -
              MARGIN_X -
              rightWidth,

            y:
              textY,

            size:
              7.5,

            font:
              regular,

            color:
              MUTED,
          }
        );
      }


      // ======================================================
      // NEW PAGE
      // ======================================================

      function newPage(
        firstPage = false
      ) {

        page =
          pdf.addPage([
            PAGE_WIDTH,
            PAGE_HEIGHT,
          ]);


        pageNumber +=
          1;


        // Top brand rule.

        page.drawRectangle({
          x:
            0,

          y:
            PAGE_HEIGHT -
            8,

          width:
            PAGE_WIDTH,

          height:
            8,

          color:
            NAVY,
        });


        y =
          PAGE_HEIGHT -
          TOP_MARGIN;


        if (!firstPage) {

          page.drawText(
            "STUDENT PROGRESS REPORT",
            {
              x:
                MARGIN_X,

              y,

              size:
                8,

              font:
                bold,

              color:
                GOLD,
            }
          );


          const continuationName =
            cleanText(
              payload.student
                .display_name
            );


          const nameWidth =
            regular
              .widthOfTextAtSize(
                continuationName,
                8
              );


          page.drawText(
            continuationName,
            {
              x:
                PAGE_WIDTH -
                MARGIN_X -
                nameWidth,

              y,

              size:
                8,

              font:
                regular,

              color:
                MUTED,
            }
          );


          y -=
            28;
        }


        drawFooter();
      }


      // ======================================================
      // SPACE CONTROL
      // ======================================================

      function ensureSpace(
        requiredHeight:
          number
      ) {

        if (
          y -
            requiredHeight <
          BOTTOM_CONTENT_Y
        ) {
          newPage(false);
        }
      }


      // ======================================================
      // PARAGRAPH
      // ======================================================

      function drawParagraph(
        text: string,

        options: {
          size?: number;
          lineHeight?: number;
          color?: any;
          font?: any;
          indent?: number;
          spacingAfter?: number;
        } = {}
      ) {

        const cleaned =
          cleanText(text);


        if (!cleaned) {
          return;
        }


        const size =
          options.size ??
          10.3;


        const lineHeight =
          options.lineHeight ??
          15;


        const selectedFont =
          options.font ??
          regular;


        const indent =
          options.indent ??
          0;


        const spacingAfter =
          options.spacingAfter ??
          6;


        const maxWidth =
          CONTENT_WIDTH -
          indent;


        const lines =
          wrapText(
            cleaned,
            selectedFont,
            size,
            maxWidth
          );


        /*
         * Avoid beginning a paragraph at the
         * very bottom of a page.
         *
         * Require room for at least two lines
         * when possible.
         */

        ensureSpace(
          Math.min(
            Math.max(
              lines.length,
              2
            ),
            3
          ) *
            lineHeight +
            spacingAfter
        );


        for (
          const line
          of lines
        ) {

          ensureSpace(
            lineHeight
          );


          page.drawText(
            line,
            {
              x:
                MARGIN_X +
                indent,

              y,

              size,

              font:
                selectedFont,

              color:
                options.color ??
                TEXT,
            }
          );


          y -=
            lineHeight;
        }


        y -=
          spacingAfter;
      }


      // ======================================================
      // SECTION TITLE
      //
      // Requires enough space for heading plus
      // the first part of the section.
      // ======================================================

      function drawSectionTitle(
        title: string,
        minimumContentSpace =
          46
      ) {

        const headingHeight =
          36;


        ensureSpace(
          headingHeight +
          minimumContentSpace
        );


        y -=
          5;


        page.drawText(
          title,
          {
            x:
              MARGIN_X,

            y,

            size:
              12.5,

            font:
              bold,

            color:
              NAVY,
          }
        );


        y -=
          9;


        page.drawLine({
          start: {
            x:
              MARGIN_X,

            y,
          },

          end: {
            x:
              MARGIN_X +
              48,

            y,
          },

          thickness:
            2,

          color:
            GOLD,
        });


        y -=
          18;
      }


      // ======================================================
      // BULLET LIST
      // ======================================================

      function drawBulletList(
        items:
          string[]
      ) {

        const safeItems =
          Array.isArray(items)
            ? items
                .map(
                  cleanText
                )
                .filter(Boolean)
            : [];


        const fontSize =
          9.8;


        const lineHeight =
          14.4;


        const bulletIndent =
          18;


        const maxWidth =
          CONTENT_WIDTH -
          bulletIndent;


        for (
          const item
          of safeItems
        ) {

          const lines =
            wrapText(
              item,
              regular,
              fontSize,
              maxWidth
            );


          if (
            !lines.length
          ) {
            continue;
          }


          /*
           * Keep the first two lines of a bullet
           * together where possible.
           */

          const initialLines =
            Math.min(
              lines.length,
              2
            );


          ensureSpace(
            initialLines *
              lineHeight +
              8
          );


          let firstLine =
            true;


          for (
            const line
            of lines
          ) {

            ensureSpace(
              lineHeight +
              3
            );


            if (
              firstLine
            ) {

              page.drawCircle({
                x:
                  MARGIN_X +
                  4,

                y:
                  y +
                  3,

                size:
                  2.15,

                color:
                  GOLD,
              });


              firstLine =
                false;
            }


            page.drawText(
              line,
              {
                x:
                  MARGIN_X +
                  bulletIndent,

                y,

                size:
                  fontSize,

                font:
                  regular,

                color:
                  TEXT,
              }
            );


            y -=
              lineHeight;
          }


          y -=
            6;
        }
      }


      // ======================================================
      // FIRST PAGE
      // ======================================================

      newPage(true);


      // ======================================================
      // BRAND HEADER
      // ======================================================

      let brandTextX =
        MARGIN_X;


      if (logo) {

        const maxLogoSize =
          58;


        const scale =
          Math.min(
            maxLogoSize /
              logo.width,

            maxLogoSize /
              logo.height
          );


        const logoWidth =
          logo.width *
          scale;


        const logoHeight =
          logo.height *
          scale;


        page.drawImage(
          logo,
          {
            x:
              MARGIN_X,

            y:
              y -
              logoHeight +
              9,

            width:
              logoWidth,

            height:
              logoHeight,
          }
        );


        brandTextX =
          MARGIN_X +
          logoWidth +
          15;
      }


      page.drawText(
        "A'S ONLINE TUTORING SERVICES",
        {
          x:
            brandTextX,

          y,

          size:
            10.5,

          font:
            bold,

          color:
            NAVY,
        }
      );


      y -=
        16;


      page.drawText(
        "Exam Success at Your Fingertips.",
        {
          x:
            brandTextX,

          y,

          size:
            8.3,

          font:
            regular,

          color:
            MUTED,
        }
      );


      y -=
        48;


      // ======================================================
      // REPORT TYPE
      // ======================================================

      page.drawText(
        "STUDENT PROGRESS REPORT",
        {
          x:
            MARGIN_X,

          y,

          size:
            8.5,

          font:
            bold,

          color:
            GOLD,
        }
      );


      y -=
        25;


      // ======================================================
      // REPORT HEADLINE
      // ======================================================

      const headline =
        cleanText(
          payload.content
            .overview
            .headline
        ) ||
        `${cleanText(
          payload.student
            .display_name
        )} Progress Report`;


      const headlineLines =
        wrapText(
          headline,
          bold,
          21,
          CONTENT_WIDTH
        );


      for (
        const line
        of headlineLines
      ) {

        page.drawText(
          line,
          {
            x:
              MARGIN_X,

            y,

            size:
              21,

            font:
              bold,

            color:
              NAVY,
          }
        );


        y -=
          26;
      }


      y -=
        10;


      // ======================================================
      // STUDENT INFORMATION CARD
      // ======================================================

      const studentName =
        cleanText(
          payload.student
            .display_name
        ) ||
        "Student";


      const school =
        cleanText(
          payload.student
            .school
        ) ||
        "—";


      const offeringNames =
        payload.offerings
          ?.map(
            (
              item
            ) =>
              cleanText(
                item
                  ?.offering_name
              )
          )
          .filter(Boolean) ??
        [];


      const programme =
        offeringNames.length
          ? offeringNames.join(
              ", "
            )
          : "—";


      const reportingPeriod =
        `${formatDate(
          payload.report
            .period_start
        )} – ${formatDate(
          payload.report
            .period_end
        )}`;


      const infoRows =
        [
          {
            label:
              "STUDENT",
            value:
              studentName,
          },

          {
            label:
              "SCHOOL",
            value:
              school,
          },

          {
            label:
              "PROGRAMME",
            value:
              programme,
          },

          {
            label:
              "REPORTING PERIOD",
            value:
              reportingPeriod,
          },
        ];


      const infoRowHeight =
        23;


      const infoPaddingTop =
        17;


      const infoPaddingBottom =
        15;


      const infoHeight =
        infoPaddingTop +
        infoPaddingBottom +
        infoRows.length *
          infoRowHeight;


      ensureSpace(
        infoHeight +
        18
      );


      const infoTop =
        y;


      page.drawRectangle({
        x:
          MARGIN_X,

        y:
          infoTop -
          infoHeight,

        width:
          CONTENT_WIDTH,

        height:
          infoHeight,

        color:
          LIGHT,

        borderColor:
          BORDER,

        borderWidth:
          0.6,
      });


      const labelX =
        MARGIN_X +
        18;


      const valueX =
        MARGIN_X +
        122;


      let infoY =
        infoTop -
        infoPaddingTop -
        5;


      for (
        const row
        of infoRows
      ) {

        page.drawText(
          row.label,
          {
            x:
              labelX,

            y:
              infoY,

            size:
              7.5,

            font:
              bold,

            color:
              MUTED,
          }
        );


        const valueLines =
          wrapText(
            row.value,
            regular,
            9.1,
            PAGE_WIDTH -
              MARGIN_X -
              valueX -
              18
          );


        /*
         * Student info values are intentionally
         * limited to the first line in this v1
         * card to preserve consistent height.
         */

        page.drawText(
          valueLines[0] ??
            "—",
          {
            x:
              valueX,

            y:
              infoY,

            size:
              9.1,

            font:
              regular,

            color:
              TEXT,
          }
        );


        infoY -=
          infoRowHeight;
      }


      y =
        infoTop -
        infoHeight -
        24;


      // ======================================================
      // ACTIVITY SUMMARY
      // ======================================================

      const activity =
        payload.activity;


      const attendance =
        activity
          ?.attendance ??
        {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          other_or_unknown: 0,
          attendance_percent:
            null,
        };


      const metrics =
        [
          {
            label:
              "Sessions",

            value:
              String(
                activity
                  ?.completed_sessions ??
                  0
              ),
          },

          {
            label:
              "Hours",

            value:
              Number(
                activity
                  ?.hours_tutored ??
                  0
              ).toFixed(
                1
              ),
          },

          {
            label:
              "Present",

            value:
              String(
                attendance
                  .present ??
                  0
              ),
          },

          {
            label:
              "Attendance",

            value:
              attendance
                .attendance_percent ===
              null
                ? "—"
                : `${attendance.attendance_percent}%`,
          },
        ];


      const metricGap =
        8;


      const metricWidth =
        (
          CONTENT_WIDTH -
          metricGap *
            (
              metrics.length -
              1
            )
        ) /
        metrics.length;


      const metricHeight =
        62;


      ensureSpace(
        metricHeight +
        30
      );


      metrics.forEach(
        (
          metric,
          index
        ) => {

          const x =
            MARGIN_X +
            index *
              (
                metricWidth +
                metricGap
              );


          page.drawRectangle({
            x,

            y:
              y -
              metricHeight,

            width:
              metricWidth,

            height:
              metricHeight,

            color:
              rgb(
                1,
                1,
                1
              ),

            borderWidth:
              0.8,

            borderColor:
              BORDER,
          });


          page.drawText(
            metric.value,
            {
              x:
                x +
                12,

              y:
                y -
                25,

              size:
                17,

              font:
                bold,

              color:
                NAVY,
            }
          );


          page.drawText(
            metric.label,
            {
              x:
                x +
                12,

              y:
                y -
                45,

              size:
                8,

              font:
                regular,

              color:
                MUTED,
            }
          );
        }
      );


      y -=
        metricHeight +
        26;


      // ======================================================
      // OVERVIEW
      // ======================================================

      const overviewSummary =
        cleanText(
          payload.content
            .overview
            .summary
        );


      if (
        overviewSummary
      ) {

        drawSectionTitle(
          "Progress Overview",
          58
        );


        drawParagraph(
          overviewSummary
        );
      }


      // ======================================================
      // LEARNING HIGHLIGHTS
      // ======================================================

      if (
        payload.content
          .learning_highlights
          ?.length
      ) {

        drawSectionTitle(
          "Learning Highlights",
          58
        );


        drawBulletList(
          payload.content
            .learning_highlights
        );
      }


      // ======================================================
      // AREAS FOR DEVELOPMENT
      // ======================================================

      if (
        payload.content
          .areas_for_development
          ?.length
      ) {

        drawSectionTitle(
          "Areas for Continued Development",
          58
        );


        drawBulletList(
          payload.content
            .areas_for_development
        );
      }


      // ======================================================
      // FOLLOW-UP PRIORITIES
      // ======================================================

      if (
        payload.content
          .follow_up_priorities
          ?.length
      ) {

        drawSectionTitle(
          "Next Learning Priorities",
          58
        );


        drawBulletList(
          payload.content
            .follow_up_priorities
        );
      }


      // ======================================================
      // CURRICULUM
      //
      // Hidden entirely when there are no approved
      // curriculum statements.
      // ======================================================

      if (
        payload.content
          .curriculum_progress
          ?.length
      ) {

        drawSectionTitle(
          "Curriculum Progress",
          58
        );


        drawBulletList(
          payload.content
            .curriculum_progress
        );
      }


      // ======================================================
      // CLOSING COMMENT
      // ======================================================

      const closingComment =
        cleanText(
          payload.content
            .closing_comment
        );


      if (
        closingComment
      ) {

        drawSectionTitle(
          "Tutor's Closing Comment",
          76
        );


        drawParagraph(
          closingComment,
          {
            size:
              10.2,

            lineHeight:
              15.2,

            spacingAfter:
              10,
          }
        );
      }


      // ======================================================
      // TUTOR SIGN-OFF
      // ======================================================

      const tutors =
        payload.tutors ??
        [];


      const tutorNames =
        tutors
          .map(
            (
              tutor
            ) =>
              cleanText(
                tutor
                  ?.display_name
              )
          )
          .filter(Boolean);


      const tutorTitles =
        tutors
          .map(
            (
              tutor
            ) =>
              cleanText(
                tutor
                  ?.title
              )
          )
          .filter(Boolean);


      if (
        tutorNames.length
      ) {

        ensureSpace(
          78
        );


        y -=
          12;


        page.drawLine({
          start: {
            x:
              MARGIN_X,

            y,
          },

          end: {
            x:
              PAGE_WIDTH -
              MARGIN_X,

            y,
          },

          thickness:
            0.7,

          color:
            BORDER,
        });


        y -=
          23;


        page.drawText(
          tutorNames.join(
            ", "
          ),
          {
            x:
              MARGIN_X,

            y,

            size:
              10.5,

            font:
              bold,

            color:
              NAVY,
          }
        );


        y -=
          16;


        page.drawText(
          tutorTitles.length
            ? tutorTitles.join(
                ", "
              )
            : "Tutor",
          {
            x:
              MARGIN_X,

            y,

            size:
              8.8,

            font:
              regular,

            color:
              MUTED,
          }
        );


        y -=
          14;


        page.drawText(
          "A's Online Tutoring Services",
          {
            x:
              MARGIN_X,

            y,

            size:
              8.8,

            font:
              regular,

            color:
              MUTED,
          }
        );
      }


      // ======================================================
      // PDF METADATA
      // ======================================================

      pdf.setTitle(
        payload.report
          .report_title ||
        `${studentName} Progress Report`
      );


      pdf.setAuthor(
        "A's Online Tutoring Services"
      );


      pdf.setSubject(
        `Student Progress Report - ${studentName}`
      );


      pdf.setProducer(
        "AEOS"
      );


      pdf.setCreator(
        "AEOS Reports"
      );


      // ======================================================
      // SAVE PDF
      // ======================================================

      const pdfBytes =
        await pdf.save();


      // ======================================================
      // MARK GENERATED
      //
      // Database controls this update.
      // ======================================================

      const {
        error:
          generatedError,
      } =
        await supabase.rpc(
          "aeos_mark_student_report_pdf_generated",
          {
            p_report_id:
              reportId,
          }
        );


      if (
        generatedError
      ) {

        /*
         * PDF itself has already rendered
         * successfully, so log this separately
         * rather than discard the valid PDF.
         */

        console.error(
          "PDF generated but pdf_generated_at could not be recorded:",
          generatedError.message
        );
      }


      // ======================================================
      // FRIENDLY DOWNLOAD FILENAME
      // ======================================================

      const studentFileName =
        safeFilenamePart(
          studentName
        ) ||
        "Student";


      const periodLabel =
        buildReportPeriodLabel(
          payload.report
            .period_start,

          payload.report
            .period_end
        );


      const filename =
        `${studentFileName}-Progress-Report-${periodLabel}.pdf`;


      // ======================================================
      // RETURN PDF
      // ======================================================

      return new Response(
        pdfBytes,
        {
          status:
            200,

          headers: {
            ...corsHeaders,

            "Content-Type":
              "application/pdf",

            "Content-Disposition":
              `attachment; filename="${filename}"`,

            "Cache-Control":
              "private, no-store, max-age=0",

            "X-Content-Type-Options":
              "nosniff",
          },
        }
      );


    } catch (
      err
    ) {

      console.error(
        "generate-student-report-pdf:",
        err
      );


      return jsonResponse(
        {
          error:
            err instanceof
              Error
              ? err.message
              : "Student report PDF generation failed.",
        },
        400
      );
    }
  }
);

