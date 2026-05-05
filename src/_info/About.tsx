// About.tsx
import { Link } from "react-router-dom";
import { Music, Heart, Headphones, Disc3 } from "lucide-react";

const About = () => {
    return (
        <div className="max-w-6xl mx-auto px-6 py-20 text-light-1">
            
            {/* Hero */}
            <section className="text-center mb-24">
                <h1 className="text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent pb-2">
                    Music has a memory.
                </h1>
                <p className="text-xl md:text-2xl text-light-3 max-w-3xl mx-auto leading-relaxed mb-10">
                    Jukeboxd is your personal soundtrack journal; 
                    track albums, rate discoveries, and share your musical identity.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/sign-up"
                        className="px-8 py-4 rounded-full bg-emerald-500 text-dark-1 font-bold hover:bg-emerald-400 transition"
                    >
                        Start Logging
                    </Link>
                    <Link
                        to="/trending"
                        className="px-8 py-4 rounded-full border border-white/10 hover:border-emerald-500 text-light-2 hover:text-emerald-400 transition"
                    >
                        Explore
                    </Link>
                </div>
            </section>

            {/* Founder Story */}
            <section className="grid md:grid-cols-2 gap-16 items-center mb-24">
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
                        Just a clean space to document your listening journey and connect
                        with others through music.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-10 backdrop-blur-sm">
                    <Disc3 className="text-emerald-400 mb-4" size={48} />
                    <p className="text-light-2 italic text-lg leading-relaxed">
                        “I wanted Letterboxd for music, so I built it.”
                    </p>
                    <p className="mt-4 text-sm text-light-3">— Finley, Creator</p>
                </div>
            </section>

            {/* Features */}
            <section className="mb-24">
                <h3 className="text-4xl font-bold text-center mb-14">
                    Everything your music taste deserves
                </h3>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Headphones,
                            title: "Track Every Listen",
                            desc: "Build your personal archive of albums, songs."
                        },
                        {
                            icon: Music,
                            title: "Rate & Review",
                            desc: "Capture your thoughts, rankings, and favorite releases."
                        },
                        {
                            icon: Heart,
                            title: "Discover Community",
                            desc: "Follow fellow listeners and uncover new music through real people."
                        }
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                        >
                            <feature.icon className="text-emerald-400 mb-4" size={36} />
                            <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                            <p className="text-light-3 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="text-center bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl p-16 text-dark-1">
                <h2 className="text-4xl font-black mb-4">
                    Start building your musical legacy.
                </h2>
                <p className="text-lg mb-8 font-medium opacity-90">
                    Every album tells a story. Keep yours forever.
                </p>

                <Link
                    to="/sign-up"
                    className="inline-block px-10 py-4 rounded-full bg-dark-1 text-light-1 font-bold hover:bg-black transition"
                >
                    Join Jukeboxd Free
                </Link>
            </section>

            {/* <section className="text-center mt-20 border-t border-white/10 pt-16">
                <h3 className="text-2xl font-bold mb-4 text-light-1">
                    Support independent music discovery
                </h3>

                <p className="text-light-3 max-w-2xl mx-auto mb-8 leading-relaxed">
                    Jukeboxd is built and maintained by one developer with a love for music and community.
                    If you believe in the project, consider supporting its growth.
                </p>

                <a
                    href="https://buymeacoffee.com/notfinley"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition"
                >
                    <Heart size={18} fill="currentColor" />
                    Support the Project
                </a>
            </section> */}
        </div>
    );
};

export default About;