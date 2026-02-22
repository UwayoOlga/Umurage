import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm bg-white">
              <Image src="/favicon.ico" alt="Umurage Logo" width={32} height={32} className="object-cover" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              Umurage
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors hidden md:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Now available for all SACCOs in Rwanda
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
              Modern Savings Groups <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                Built on Trust.
              </span>
            </h1>

            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience the future of Ibimina. Secure contributions, instant loans, and transparent record-keeping all in one beautiful app.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all text-center"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-50/50 rounded-full blur-3xl -z-10" />
        </section>

        {/* Feature Grid */}
        <section className="bg-white py-24 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: Shield,
                  title: "Bank-Grade Security",
                  desc: "Your group's data is protected with enterprise-level encryption and secure backups."
                },
                {
                  icon: Zap,
                  title: "Instant Mobile Money",
                  desc: "Seamless integration with MTN MoMo and Airtel Money for instant transfers at zero fees."
                },
                {
                  icon: CheckCircle2,
                  title: "Transparent Records",
                  desc: "Every franc is accounted for. Real-time updates for all members, eliminating disputes."
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
              <Image src="/favicon.ico" alt="Umurage Logo" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-semibold text-slate-200">Umurage</span>
          </div>
          <p className="text-sm">© 2026 Umurage Ltd. Built for Rwanda 🇷🇼</p>
        </div>
      </footer>
    </div>
  );
}
