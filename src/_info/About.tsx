import { Link } from 'react-router-dom';
import { Music, Code, Heart, Headphones } from 'lucide-react';

const About = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-light-1 bg-dark-1 min-h-screen">
        {/* Header Section */}
        <section className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            About Jukeboxd
            </h1>
            <p className="text-xl text-light-3 max-w-2xl mx-auto leading-relaxed">
            Your personal music diary and recommendation hub. 
            Built for those who live life through a pair of headphones.
            </p>
        </section>

        {/* The "Solo Passion" Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-500">
                <Heart size={24} fill="currentColor" />
                <h2 className="text-2xl font-semibold">A Passion Project</h2>
            </div>
            <p className="text-light-2 leading-relaxed">
                Jukeboxd isn't owned by a big corporation or a data-hungry tech giant. 
                It is a <strong>solo passion project</strong> built from the ground up by a single 
                developer who loves music just as much as you do.
            </p>
            <p className="text-light-2 leading-relaxed">
                I started this project because I wanted a cleaner, more personal way to 
                track my listening habits, rate my favorite albums, and share reviews 
                with a community that actually cares about the art.
            </p>
            </div>
            
            <div className="bg-dark-2 p-8 rounded-2xl border border-white/5 shadow-2xl">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <Code size={20} />
                </div>
                <div>
                    <h4 className="font-semibold">Built with Modern Tech</h4>
                    <p className="text-sm text-light-3">React, TypeScript, & Supabase</p>
                </div>
                </div>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <Music size={20} />
                </div>
                <div>
                    <h4 className="font-semibold">Powered by Spotify</h4>
                    <p className="text-sm text-light-3">Seamless metadata integration</p>
                </div>
                </div>
            </div>
            </div>
        </section>

        {/* What you can do */}
        <section className="mb-20">
            <h3 className="text-3xl font-bold mb-10 text-center">What is Jukeboxd?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3 p-4">
                <Headphones className="mx-auto text-emerald-500" size={32} />
                <h4 className="font-bold text-lg">Log Your Listens</h4>
                <p className="text-sm text-light-3">Keep a visual history of every album and song you discover.</p>
            </div>
            <div className="space-y-3 p-4">
                <Music className="mx-auto text-emerald-500" size={32} />
                <h4 className="font-bold text-lg">Rate & Review</h4>
                <p className="text-sm text-light-3">Share your hot takes and deep dives with other music lovers.</p>
            </div>
            <div className="space-y-3 p-4">
                <Heart className="mx-auto text-emerald-500" size={32} />
                <h4 className="font-bold text-lg">Social Discovery</h4>
                <p className="text-sm text-light-3">Follow friends and see what the community is vibing to.</p>
            </div>
            </div>
        </section>

        {/* Call to Action */}
        <section className="text-center p-12 bg-emerald-600 rounded-3xl text-white">
            <h2 className="text-3xl font-black mb-4 text-dark-1">Join the rhythm.</h2>
            <p className="mb-8 font-medium text-dark-1 opacity-90">Start your musical diary today and never forget a great track again.</p>
            <Link 
            to="/sign-up" 
            className="bg-dark-1 text-light-1 px-8 py-3 rounded-full font-bold hover:bg-black transition border border-white/10"
            >
            Get Started for Free
            </Link>
        </section>
        </div>
    );
};

export default About;