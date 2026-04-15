import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CountMeInHero from "../components/countmeintt/CountMeInHero";
import CountMeInGallery from "../components/countmeintt/CountMeInGallery";
import CountMeInWhatItIs from "../components/countmeintt/CountMeInWhatItIs";
import CountMeInWhyItWorks from "../components/countmeintt/CountMeInWhyItWorks";
import CountMeInImpact from "../components/countmeintt/CountMeInImpact";
import CountMeInPartners from "../components/countmeintt/CountMeInPartners";
import CountMeInFeaturedChallenge from "../components/countmeintt/CountMeInFeaturedChallenge";
import CountMeInChallengesGrid from "../components/countmeintt/CountMeInChallengesGrid";
import CountMeInEvents from "../components/countmeintt/CountMeInEvents";
import CountMeInHowToUse from "../components/countmeintt/CountMeInHowToUse";
import CountMeInResources from "../components/countmeintt/CountMeInResources";
import CountMeInSchools from "../components/countmeintt/CountMeInSchools";
import CountMeInSocial from "../components/countmeintt/CountMeInSocial";
import CountMeInCTA from "../components/countmeintt/CountMeInCTA";

export default function CountMeInTT() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main>
        <CountMeInHero />
        <CountMeInGallery />
        <CountMeInWhatItIs />
        <CountMeInWhyItWorks />
        <CountMeInImpact />
        <CountMeInPartners />
        <CountMeInFeaturedChallenge />
        <CountMeInChallengesGrid />
        <CountMeInEvents />
        <CountMeInHowToUse />
        <CountMeInResources />
        <CountMeInSchools />
        <CountMeInSocial />
        <CountMeInCTA />
      </main>

      <Footer />
    </div>
  );
}


