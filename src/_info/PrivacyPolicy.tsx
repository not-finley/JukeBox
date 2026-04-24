const PrivacyPolicy = () => {
    const lastUpdated = "April 23, 2026";
    const appName = "Jukeboxd";
    const contactEmail = "finley.harrison@me.com";

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-light-1 bg-dark-1 min-h-screen">
        <h1 className="text-4xl font-bold mb-4">{appName} Privacy Policy</h1>
        <p className="text-emerald-700 mb-8">Last Updated: {lastUpdated}</p>

        <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="leading-relaxed text-light-2">
            Welcome to {appName}. We respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our 
            service to track and review music.
            </p>
        </section>

        <section className="mb-8 border-t border-white/10 pt-6">
            <h2 className="text-2xl font-semibold mb-3 text-light-2">2. Data We Collect</h2>
            <p className="mb-4 text-light-2">When you sign in via Google OAuth, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 text-light-2">
            <li><strong>Email Address:</strong> Used as your unique account identifier.</li>
            <li><strong>Name & Profile Picture:</strong> Used to personalize your profile and public reviews.</li>
            <li><strong>Google ID:</strong> A technical identifier to securely link your Google account to your {appName} data.</li>
            </ul>
        </section>

        <section className="mb-8 border-t border-white/10 pt-6">
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Data</h2>
            <p className="mb-4 text-light-2">We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-light-2">
            <li>To create and maintain your personal music diary.</li>
            <li>To display your username and avatar alongside your album/song reviews.</li>
            <li>To provide personalized music recommendations.</li>
            <li>To maintain the security and integrity of our application.</li>
            </ul>
        </section>

        <section className="mb-8 border-t border-white/10 pt-6">
            <h2 className="text-2xl font-semibold mb-3 text-red-400">4. Data Sharing & Third Parties</h2>
            <p className="leading-relaxed text-light-2">
            <strong>We do not sell your personal data.</strong> We only share information with third-party 
            services (like Supabase and Google) strictly necessary to provide the service. Your music reviews 
            may be visible to other users of the platform as part of the social experience.
            </p>
        </section>

        <section className="mb-8 border-t border-white/10 pt-6">
            <h2 className="text-2xl font-semibold mb-3">5. Data Retention & Deletion</h2>
            <p className="leading-relaxed text-light-2">
            We retain your information as long as your account is active. You may request to delete your 
            account and all associated data at any time by contacting us. Upon deletion, your reviews 
            will be anonymized or removed from our database.
            </p>
        </section>

        <section className="mb-12 border-t border-white/10 pt-6 text-center">
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p className="text-emerald-700">
            If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <a href={`mailto:${contactEmail}`} className="text-emerald-500 font-medium hover:underline">
            {contactEmail}
            </a>
        </section>
        </div>
    );
};

export default PrivacyPolicy;