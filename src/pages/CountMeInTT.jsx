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
import { Helmet } from "react-helmet-async";

export default function CountMeInTT() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
  <title>CountMeInTT | Turning Mathematics Practice Into a Game</title>
  <meta
    name="description"
    content="CountMeInTT helps students build multiplication speed, accuracy, and confidence through challenge, repetition, and competition. This  math game gives students, at primary and secondary school levels, critical skills for improved learning in mathematics and other subject areas. The multiplication times table is an essential part of mathematics foundations and the multiples that are tested for this math exercise, is a great way to help students conquer their fear of math and gain the confidence needed for other parts of learning."
  />
  <meta
    property="og:title"
    content="CountMeInTT | Turning Mathematics Practice Into a Game"
  />
  <meta
    property="og:description"
    content="CountMeInTT helps students build multiplication speed, accuracy, and confidence through challenge, repetition, and competition. This  math game gives students, at primary and secondary school levels, critical skills for improved learning in mathematics and other subject areas. The multiplication times table is an essential part of mathematics foundations and the multiples that are tested for this math exercise, is a great way to help students conquer their fear of math and gain the confidence needed for other parts of learning."
  />
</Helmet>

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


