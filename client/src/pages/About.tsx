import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Eye, Zap, Globe, Quote, Mail } from "lucide-react";
import founderPhoto from "@assets/WhatsApp_Image_2026-05-06_at_16.46.18_1778057698055.jpeg";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};

const values = [
  {
    icon: Eye,
    title: "Radical Visibility",
    text: "Making every scholarship, grant, and fund visible and searchable.",
    accent: "blue",
  },
  {
    icon: Zap,
    title: "AI-Precision",
    text: "No more guessing. Our semantic engine matches you to what you actually qualify for.",
    accent: "emerald",
  },
  {
    icon: Globe,
    title: "Community Driven",
    text: "Rooted in Malaysia, built for the next generation of global leaders.",
    accent: "purple",
  },
];

const accentMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
};

export default function About() {
  useEffect(() => {
    document.title = "About | Linku";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-white">
      <Header />

      <main className="flex-1">

        {/* ── Section A: Hero / Mission ── */}
        <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[600px] h-[400px] rounded-full bg-blue-600/18 blur-[120px]" />
          </div>

          <motion.div
            className="relative z-10 max-w-3xl mx-auto text-center"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-4"
            >
              Our Mission
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-8 leading-none"
              data-testid="text-hero-title"
            >
              Democratizing
              <span className="block text-blue-500">Opportunity.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto"
              data-testid="text-hero-subtitle"
            >
              We believe that talent is evenly distributed, but opportunity is not. Linku is an
              AI-powered engine built to bridge the gap between ambitious Malaysian students and
              the funding they deserve.
            </motion.p>
          </motion.div>
        </section>

        {/* ── Section B: Founder's Story ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="grid md:grid-cols-2 gap-12 items-center"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              {/* Founder photo */}
              <motion.div variants={fadeUp} className="flex justify-center md:justify-start">
                <div
                  className="w-full max-w-sm aspect-[3/4] rounded-3xl border border-emerald-500/25 relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.12)]"
                  data-testid="founder-photo"
                >
                  <img
                    src={founderPhoto}
                    alt="Khai — Founder of Linku, at MIT"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Subtle gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0F19]/80 to-transparent pointer-events-none" />
                  <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 z-10">
                    Khai @ MIT, Cambridge MA
                  </p>
                </div>
              </motion.div>

              {/* Story text */}
              <motion.div variants={fadeUp} className="space-y-6">
                <h2
                  className="text-3xl sm:text-4xl font-black leading-tight"
                  data-testid="text-founder-heading"
                >
                  Built by Students,
                  <span className="block text-emerald-400">For Students.</span>
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Linku wasn't built in a corporate boardroom. It was born out of frustration. As
                  a student coming from a humble background in Sabah, navigating the maze of
                  scholarship applications felt like a second full-time job. Broken links, hidden
                  requirements, and missed deadlines were the norm.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  But education changes everything. That drive eventually led our founder, Khai,
                  to represent Malaysia in the United States as a fellow for innovation and
                  entrepreneurship. That experience solidified a core belief: technology should be
                  used to lift others up. Now a Software Engineering student at UMS, Khai built
                  Linku to ensure the ladder of opportunity is accessible to everyone.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Section C: Quote ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-3xl border border-blue-500/15 bg-white/[0.03] backdrop-blur-md p-10 sm:p-14"
            >
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-64 h-40 bg-blue-600/15 blur-[80px] pointer-events-none" />

              <Quote
                className="w-14 h-14 text-blue-500/70 mb-6 relative z-10"
                strokeWidth={1.5}
                data-testid="icon-quote"
              />

              <blockquote
                className="relative z-10 text-xl sm:text-2xl lg:text-3xl font-medium text-white leading-relaxed mb-8 italic"
                data-testid="text-quote"
              >
                "I know what it's like to wonder if you can afford your ambitions. I built Linku
                to make sure no student ever has to abandon their future simply because they
                couldn't find the right door to open."
              </blockquote>

              <p
                className="relative z-10 text-sm text-gray-500 font-medium"
                data-testid="text-quote-attribution"
              >
                — Khairul Iznill (Khai), Founder &amp; Lead Developer
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Section D: Core Values ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-3xl sm:text-4xl font-black mb-3"
                data-testid="text-values-title"
              >
                What We Stand For
              </h2>
              <p className="text-gray-500 text-sm">The principles that guide every decision we make</p>
            </motion.div>

            <motion.div
              className="grid sm:grid-cols-3 gap-5"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              {values.map((v, i) => {
                const ac = accentMap[v.accent];
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/8 hover:border-white/15 p-7 flex flex-col gap-4 transition-colors"
                    data-testid={`card-value-${i}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${ac.bg} border ${ac.border}`}>
                      <v.icon className={`w-5 h-5 ${ac.text}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1.5">{v.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{v.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ── Section F: Get in Touch ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ boxShadow: "0 0 40px rgba(59,130,246,0.14)" }}
              className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-500/30 transition-all duration-300 p-10 sm:p-14 flex flex-col items-center text-center gap-6"
              data-testid="card-contact"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>

              {/* Text */}
              <div className="space-y-3">
                <h2
                  className="text-2xl sm:text-3xl font-bold text-white"
                  data-testid="text-contact-heading"
                >
                  Let's Connect.
                </h2>
                <p
                  className="text-gray-400 leading-relaxed max-w-md mx-auto text-sm sm:text-base"
                  data-testid="text-contact-subheading"
                >
                  Whether you have questions about the platform, want to provide feedback, or are
                  interested in partnering to help more students, my inbox is always open.
                </p>
              </div>

              {/* Button */}
              <a href="mailto:linkueducationmy@gmail.com" data-testid="link-email-founder">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/15 text-white hover:bg-white/8 hover:border-blue-500/40 hover:text-blue-300 transition-all px-8"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email the Founder
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── Section E: CTA ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <motion.div
            className="max-w-xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-black mb-4"
              data-testid="text-cta-title"
            >
              Ready to fund your future?
            </h2>
            <p className="text-gray-500 mb-8 text-sm">
              Join thousands of Malaysian students discovering their perfect scholarship match.
            </p>
            <Link href="/onboarding">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 text-base shadow-[0_0_24px_rgba(59,130,246,0.35)]"
                  data-testid="button-cta-profile"
                >
                  Create Your Free AI Profile
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-700">
          <p>&copy; {new Date().getFullYear()} Linku. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
