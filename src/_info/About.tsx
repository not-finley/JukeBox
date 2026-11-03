import { Link } from "react-router-dom";
import { Headphones, Music, Users, ArrowUpRight } from "lucide-react";

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-zinc-100">
      {/* Hero Section */}
      <section className="mb-20 md:mb-28">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-mono mb-4">
          About Jukeboxd
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
          Music has a memory. <br />
          <span className="text-zinc-500 font-normal">Catalog yours.</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-8">
          Jukeboxd is a personal soundtrack journal. Track albums, log listens, rate rare finds, and share your musical identity with friends.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/sign-up"
            className="px-6 py-3 rounded-md bg-zinc-100 text-zinc-950 font-medium hover:bg-white transition-colors text-sm"
          >
            Start Logging Free
          </Link>
          <Link
            to="/trending"
            className="px-6 py-3 rounded-md border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors text-sm flex items-center gap-1.5"
          >
            Explore Community
            <ArrowUpRight size={16} className="text-zinc-500" />
          </Link>
        </div>
      </section>

      {/* Founder / Vision Section */}
      <section className="border-t border-zinc-800/80 pt-16 mb-20 md:mb-28">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5">
            <h2 className="text-2xl font-semibold tracking-tight text-white mb-3">
              Built for listeners.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Crafted for people who care deeply about full-album listens, cataloging eras of their taste, and cutting out algorithmic noise.
            </p>
          </div>

          <div className="md:col-span-7 md:pl-6">
            <blockquote className="border-l-2 border-emerald-500/80 pl-6 py-1 text-lg text-zinc-200 italic font-normal leading-relaxed">
              “I wanted a clean, focused alternative specifically built for music listening history—without social clutter or engagement bait.”
            </blockquote>
            <p className="mt-4 pl-6 text-xs text-zinc-500 font-mono">
              Finley — Creator & Developer
            </p>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="border-t border-zinc-800/80 pt-16 mb-20 md:mb-28">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-10">
          Features
        </h3>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: Headphones,
              title: "Track Every Listen",
              desc: "Build a permanent digital archive of full albums, EPs, and rare spins."
            },
            {
              icon: Music,
              title: "Rate & Review",
              desc: "Log your thoughts, star rankings, and favorite standout tracks."
            },
            {
              icon: Users,
              title: "Discover Together",
              desc: "Follow fellow listeners, swap ratings, and see what your friends spin."
            }
          ].map((feature, i) => (
            <div key={i} className="space-y-3">
              <feature.icon size={20} className="text-zinc-400 stroke-[1.75]" />
              <h4 className="text-base font-medium text-white">{feature.title}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-zinc-800/80 pt-16 pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Ready to log your first album?
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Free forever. No credit card required.
          </p>
        </div>

        <Link
          to="/sign-up"
          className="inline-flex justify-center items-center px-6 py-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-sm transition-colors shrink-0"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
};

export default About;
