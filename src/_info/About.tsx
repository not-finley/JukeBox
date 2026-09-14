import { Link } from "react-router-dom";
import { Music, Headphones, Disc3, ShieldCheck, Users } from "lucide-react";

const SoundWave = ({ position }: { position: "left" | "right" }) => (
  <div 
    className={`absolute bottom-0 ${position === "left" ? "left-4 lg:left-10" : "right-4 lg:right-10"} 
    hidden lg:flex items-end gap-1.5 opacity-20 pointer-events-none select-none`}
    style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 10q20%)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)' }}
  >
    {[...Array(10)].map((_, i) => (
      <div
        key={i}
        className="w-1 bg-emerald-400 rounded-full animate-wave origin-bottom"
        style={{
          height: `${50 + (i % 3) * 15}px`,
          animationDelay: `${i * 0.15}s`,
          animationDuration: `${1 + (i % 4) * 0.2}s`
        }}
      />
    ))}
  </div>
);

const About = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 text-light-1 overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative text-center mb-24 md:mb-32 pt-8 md:pt-16">
        <SoundWave position="left" />
        <SoundWave position="right" />

        <div className="relative z-10">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            The Letterboxd for Music Discovery
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent pb-2">
            Music has a memory.
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-light-3 max-w-2xl mx-auto leading-relaxed mb-10">
            Jukeboxd is your personal soundtrack journal. Track albums, log listens, rate rare finds, and share your musical identity with friends.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/sign-up"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 text-dark-1 font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:scale-105"
            >
              Start Logging Free
            </Link>
            <Link
              to="/trending"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 hover:border-emerald-500 text-light-2 hover:text-emerald-400 transition-all backdrop-blur-sm bg-white/[0.02]"
            >
              Explore Community
            </Link>
          </div>
        </div>

       
      </section>

      {/* Founder Story */}
      <section className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-28 md:mb-36">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase">
            Indie Built
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Built by a real music lover, for music lovers.
          </h2>
          <p className="text-light-2 leading-relaxed text-base sm:text-lg">
            Jukeboxd is an independent platform crafted for people who care deeply about full-album listens, underground artists, and cataloging every era of their taste.
          </p>
          <div className="space-y-3 pt-2 text-light-3 text-sm sm:text-base">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
              <span>Zero bloated social network clutter or algorithmic feeds.</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
              <span>Pure focus on your personal library and musical legacy.</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent border border-white/10 rounded-3xl p-8 sm:p-10 backdrop-blur-md overflow-hidden shadow-xl">
          <Disc3 className="text-emerald-400 mb-6 animate-spin-slow" size={40} />
          <blockquote className="relative z-10 text-light-1 italic text-lg sm:text-xl font-medium leading-relaxed">
            “I wanted a clean, beautiful Letterboxd alternative specifically for music listening history, so I built it.”
          </blockquote>
          <div className="relative z-10 mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex-center font-bold text-emerald-400 text-sm">
              F
            </div>
            <div>
              <p className="text-sm font-bold text-white">Finley</p>
              <p className="text-xs text-light-3">Creator & Developer</p>
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-28 md:mb-36">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            Everything your taste deserves
          </h3>
          <p className="text-light-3 text-sm sm:text-base">
            Designed with precision performance, deep listening states, and clean aesthetic layouts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: Headphones,
              title: "Track Every Listen",
              desc: "Build your permanent digital archive of albums, EPs, and deep cuts you spin."
            },
            {
              icon: Music,
              title: "Rate & Review",
              desc: "Capture your honest thoughts, star rankings, and favorite standout tracks."
            },
            {
              icon: Users,
              title: "Discover Community",
              desc: "Follow fellow listeners, compare ratings, and uncover what your friends are spinning."
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent hover:from-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex-center text-emerald-400 mb-6 transition-transform duration-300 group-hover:scale-110">
                <feature.icon size={24} />
              </div>
              <h4 className="text-xl font-bold mb-3 text-white">{feature.title}</h4>
              <p className="text-light-3 text-sm sm:text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative overflow-hidden text-center bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl p-10 sm:p-16 text-white shadow-2xl border border-emerald-400/20">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Start building your musical legacy.
          </h2>
          <p className="text-base sm:text-lg mb-8 font-medium text-emerald-100/90">
            Every album tells a story. Keep track of yours forever, completely free.
          </p>

          <Link
            to="/sign-up"
            className="inline-block px-10 py-4 rounded-full bg-white text-dark-1 font-bold shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Join Jukeboxd Free
          </Link>
        </div>

        {/* Ambient background rings */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-black/20 rounded-full blur-2xl pointer-events-none" />
      </section>
    </div>
  );
};

export default About;