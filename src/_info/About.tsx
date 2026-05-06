// About.tsx
import { Link } from "react-router-dom";
import { Music, Heart, Headphones, Disc3 } from "lucide-react";


const SoundWave = ({ position }: { position: "left" | "right" }) => (

  <div 
    className={`absolute bottom-0 ${position === "left" ? "left-6" : "right-6"} 
    hidden md:flex items-end gap-1.5 opacity-30 pointer-events-none select-none`}
    style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)' }}
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
    <div className="max-w-6xl mx-auto px-6 py-20 text-light-1">
      
      {/* Hero */}
      <section className="relative text-center mb-32 pt-16">
        {/* Animated Sound Waves - Positioned relative to hero section */}
        <SoundWave position="left" />
        <SoundWave position="right" />

        <div className="relative z-10">
          <h1 className="text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent pb-2">
            Music has a memory.
          </h1>
          <p className="text-xl md:text-2xl text-light-3 max-w-3xl mx-auto leading-relaxed mb-12">
            Jukeboxd is your personal soundtrack journal; 
            track albums, rate discoveries, and share your musical identity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/sign-up"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-emerald-500 text-dark-1 font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              Start Logging
            </Link>
            <Link
              to="/trending"
              className="w-full sm:w-auto px-10 py-4 rounded-full border border-white/10 hover:border-emerald-500 text-light-2 hover:text-emerald-400 transition backdrop-blur-sm"
            >
              Explore
            </Link>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="grid md:grid-cols-2 gap-16 items-center mb-32">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <Heart size={24} fill="currentColor" />
            <h2 className="text-3xl font-bold">Built by a real music lover</h2>
          </div>
          <p className="text-light-2 leading-relaxed text-lg">
            Jukeboxd is an independent solo-built platform, made for people
            who care deeply about albums, artists, and discovering sounds that matter.
          </p>
          <p className="text-light-3 leading-relaxed">
            No corporate algorithms. No bloated social clutter.
            Just a clean space to document your listening journey.
          </p>
        </div>

        <div className="group relative bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-10 backdrop-blur-sm overflow-hidden">
          <Disc3 className="text-emerald-400 mb-4 animate-spin-slow" size={48} />
          <p className="relative z-10 text-light-2 italic text-lg leading-relaxed">
            “I wanted Letterboxd for music, so I built it.”
          </p>
          <p className="relative z-10 mt-4 text-sm text-light-3">— Finley, Creator</p>
          {/* Subtle background glow for the quote box */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors" />
        </div>
      </section>

      {/* Features */}
      <section className="mb-32">
        <h3 className="text-4xl font-bold text-center mb-16">
          Everything your taste deserves
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Headphones,
              title: "Track Every Listen",
              desc: "Build your personal archive of albums and songs."
            },
            {
              icon: Music,
              title: "Rate & Review",
              desc: "Capture your thoughts, rankings, and favorite releases."
            },
            {
              icon: Heart,
              title: "Discover Community",
              desc: "Follow fellow listeners and uncover new music."
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
            >
              <feature.icon className="text-emerald-400 mb-6 transition-transform duration-500 group-hover:scale-110" size={32} />
              <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
              <p className="text-light-3 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-3xl p-16 text-white shadow-2xl">
        <h2 className="text-4xl font-black mb-4">
          Start building your musical legacy.
        </h2>
        <p className="text-lg mb-10 font-medium opacity-80">
          Every album tells a story. Keep yours forever.
        </p>

        <Link
          to="/sign-up"
          className="inline-block px-12 py-4 rounded-full bg-white text-dark-1 font-bold hover:scale-105 transition-transform"
        >
          Join Jukeboxd Free
        </Link>
      </section>
    </div>
  );
};

export default About;