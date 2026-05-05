import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  MessageSquare,
  Target,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Award,
  Users,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const features = [
  {
    icon: Target,
    title: "Smart Eligibility Matching",
    desc: "Filters based on CGPA, SPM results, household income, state restrictions, and Bumiputera status.",
    accent: "blue",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Recommendations",
    desc: "Our AI understands your goals and interests to rank scholarships by relevance and fit.",
    accent: "purple",
  },
  {
    icon: MessageSquare,
    title: "Socratic Mentor Chat",
    desc: "Get AI-guided help crafting compelling essays using the proven STAR method.",
    accent: "emerald",
  },
  {
    icon: Globe,
    title: "Local & International",
    desc: "Discover opportunities for studying in Malaysia and abroad from government and private sponsors.",
    accent: "blue",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    desc: "Stay informed about new scholarships, deadline reminders, and application status changes.",
    accent: "amber",
  },
  {
    icon: CheckCircle,
    title: "English Proficiency Mapping",
    desc: "Universal CEFR scale maps MUET, IELTS, and SPM scores for cross-test matching.",
    accent: "pink",
  },
];

const steps = [
  {
    step: "01",
    icon: BookOpen,
    title: "Create Your Profile",
    desc: "Tell us about your academic background, interests, and eligibility criteria through our simple onboarding process.",
    color: "blue",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "AI Matches You",
    desc: "Our AI analyzes your profile and finds scholarships that match your qualifications, interests, and goals.",
    color: "purple",
  },
  {
    step: "03",
    icon: MessageSquare,
    title: "Craft Your Application",
    desc: "Use our Socratic Mentor AI to prepare compelling applications using the STAR method.",
    color: "emerald",
  },
  {
    step: "04",
    icon: Award,
    title: "Apply & Win",
    desc: "Submit your applications with confidence and track your scholarship journey all in one place.",
    color: "amber",
  },
];

const accentClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/40",
  },
  purple: {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/40",
  },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
  },
  amber: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/40",
  },
  pink: {
    bg: "bg-pink-500/15",
    text: "text-pink-400",
    border: "border-pink-500/40",
  },
};

export default function Landing() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Linku | AI-Powered Scholarship Matching";
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/15 blur-[130px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-400/5 blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 w-full">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                AI-Powered Scholarship Matching
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight"
              data-testid="text-hero-title"
            >
              Fund Your Future.
              <span className="block text-blue-500">Faster.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              Discover scholarships tailored for Malaysian students. Our AI
              analyzes your profile and matches you with opportunities you
              actually qualify for.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/scholarships">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                  data-testid="button-browse-scholarships"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Find Scholarships
                </Button>
              </Link>
              {!user ? (
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 font-semibold px-8"
                    data-testid="button-get-started"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/onboarding">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 font-semibold px-8"
                    data-testid="button-create-profile"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create AI Profile
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 py-14 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[
              { value: "50+", label: "Active Scholarships", color: "text-blue-400" },
              { value: "RM50M+", label: "Total Value Available", color: "text-emerald-400" },
              { value: "20+", label: "Scholarship Providers", color: "text-purple-400" },
              { value: "95%", label: "Match Accuracy", color: "text-amber-400" },
            ].map((stat, i) => (
              <motion.div key={i} variants={cardVariant}>
                <div
                  className={`text-4xl lg:text-5xl font-black mb-1 ${stat.color}`}
                  data-testid={`stat-${i}`}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bento Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-black mb-4"
              data-testid="text-features-title"
            >
              Why Choose{" "}
              <span className="text-blue-500">Linku</span>?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built specifically for Malaysian students seeking educational
              funding
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {features.map((feature, i) => {
              const ac = accentClasses[feature.accent];
              return (
                <motion.div
                  key={i}
                  variants={cardVariant}
                  whileHover={{ scale: 1.02 }}
                  className="group p-6 rounded-2xl bg-[#1A202C] border border-white/5 hover:border-blue-500/40 transition-all cursor-default"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${ac.bg}`}
                  >
                    <feature.icon className={`w-5 h-5 ${ac.text}`} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-white/8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-black mb-4"
              data-testid="text-howitworks-title"
            >
              How It Works
            </h2>
            <p className="text-gray-400">
              Four simple steps to find and win scholarships tailored for you
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/60 via-purple-500/30 to-transparent" />
            <div className="space-y-12">
              {steps.map((item, i) => {
                const ac = accentClasses[item.color];
                return (
                  <motion.div
                    key={i}
                    className="relative flex gap-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border ${ac.bg} ${ac.border}`}
                    >
                      <item.icon className={`w-5 h-5 ${ac.text}`} />
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-mono text-gray-600 mb-1 block">
                        {item.step}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/8 p-12 overflow-hidden text-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <h2
                className="text-3xl sm:text-4xl font-black mb-4"
                data-testid="text-cta-title"
              >
                Ready to Fund Your Future?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Join Malaysian students who have discovered life-changing
                educational opportunities through Linku.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/scholarships">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
                    data-testid="button-cta-browse"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Browse Scholarships
                  </Button>
                </Link>
                {!user && (
                  <Link href="/signup">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 font-semibold px-8"
                      data-testid="button-cta-signup"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Create Free Account
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="text-2xl font-black text-white">
                Linku<span className="text-blue-500">.</span>
              </span>
              <p className="text-xs text-gray-600 mt-1">
                Malaysia's AI Scholarship Platform
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link
                href="/scholarships"
                className="hover:text-white transition-colors"
                data-testid="link-footer-scholarships"
              >
                Scholarships
              </Link>
              <Link
                href="/subscription"
                className="hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/onboarding"
                className="hover:text-white transition-colors"
                data-testid="link-footer-profile"
              >
                Create Profile
              </Link>
              <Link
                href="/login"
                className="hover:text-white transition-colors"
                data-testid="link-footer-login"
              >
                Login
              </Link>
            </div>

            <p
              className="text-sm text-gray-600"
              data-testid="text-copyright"
            >
              &copy; {new Date().getFullYear()} Linku. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
