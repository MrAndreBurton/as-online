import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSduZj2qI01suyHDZN7TixWnPE83NMuFB4SkpgRmedWNKCWYJw/viewform?usp=header";

const contactPhoneDisplay = "+1 (868) 745-3315";
const contactPhoneLink = "tel:+18687453315";
const whatsappLink =
  "https://wa.me/18687453315?text=Hi%20I'm%20interested%20in%20tutoring";
const emailAddress = "asonlinetutor@gmail.com";
const emailLink = `mailto:${emailAddress}`;

const socialLinks = [
  {
    label: "Facebook",
    handle: "A’s Online Tutoring Services",
    href: "https://www.facebook.com/Asonlinetutors/",
  },
  {
    label: "Instagram",
    handle: "@asonlinetutor",
    href: "https://www.instagram.com/asonlinetutor",
  },
  {
    label: "TikTok",
    handle: "@GetYourEducation",
    href: "https://www.tiktok.com/@getyoureducation?is_from_webapp=1&sender_device=pc",
  },
  {
    label: "YouTube",
    handle: "Get Your Education",
    href: "https://youtube.com/@getyoureducation960?si=CClN1wzoP8EI_mWv",
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                Contact
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Get in Touch
              </h1>
              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
                Have a question or ready to get started? Reach out and let’s take the next step.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="rounded-[2rem] border border-sky-400/20 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Call / WhatsApp
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              {contactPhoneDisplay}
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-200">
              The fastest way to reach A&apos;s Online is by phone or WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={contactPhoneLink}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Call Now
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Message on WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Email
            </p>
            <h2 className="mt-4 break-all text-2xl font-semibold tracking-tight text-white lg:text-3xl">
              {emailAddress}
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-300">
              Prefer email? Send your questions and we’ll point you in the right direction.
            </p>

            <div className="mt-8">
              <a
                href={emailLink}
                className="inline-flex rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Send Email
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Quick Action
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              Ready to get started?
            </h2>

            <div className="mt-8 flex justify-center">
              <a
                href={registrationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Register Now
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Follow A’s Online
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Stay connected across platforms.
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-300">
              Follow for tips, practice content, and updates.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:bg-slate-900/80"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm font-medium leading-7 text-white">
                    {item.handle}
                  </p>
                </a>
              ))}
            </div>

            <p className="mt-8 text-sm leading-7 text-slate-400">
              We typically respond within a few hours.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}



