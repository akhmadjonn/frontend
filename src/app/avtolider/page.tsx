'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
  Star,
  ChevronRight,
  Phone,
  MessageCircle,
  Shield,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  Play,
  Menu,
  X,
  Globe,
  Smartphone,
  Brain,
  TrendingUp,
  Send,
} from 'lucide-react';

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Fade-in on scroll ──────────────────────────────────────────
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Real Car Side-Profile Images ───────────────────────────────
const CAR_IMAGES = [
  '/cars/car-gray-coupe.png',    // Gray BMW M6 — side profile
  '/cars/car-silver-sedan.png',  // Silver BMW 3 Series — side profile
  '/cars/car-white-sedan.png',   // White Toyota Corolla — side profile
  '/cars/car-blue-sedan.png',    // Blue Toyota Corolla — side profile
  '/cars/car-dark-sport.png',    // Dark Audi R8 — side profile
];

function CarParade() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none overflow-hidden">
      {/* Gray BMW M6 — fast */}
      <div className="absolute bottom-1" style={{ animation: 'car-drive 9s linear infinite', animationDelay: '0s' }}>
        <img src={CAR_IMAGES[0]} alt="" className="h-14 w-auto object-contain drop-shadow-lg" draggable={false} />
      </div>
      {/* Silver BMW 3 Series — medium */}
      <div className="absolute bottom-1" style={{ animation: 'car-drive 13s linear infinite', animationDelay: '-5s' }}>
        <img src={CAR_IMAGES[1]} alt="" className="h-11 w-auto object-contain drop-shadow-md" draggable={false} />
      </div>
      {/* White Toyota Corolla — slow */}
      <div className="absolute bottom-1" style={{ animation: 'car-drive 16s linear infinite', animationDelay: '-10s' }}>
        <img src={CAR_IMAGES[2]} alt="" className="h-10 w-auto object-contain drop-shadow-md" draggable={false} />
      </div>
    </div>
  );
}

// ─── Traffic Light Component ────────────────────────────────────
function TrafficLight() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActive((p) => (p + 1) % 3), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg viewBox="0 0 40 100" className="w-8 h-20" fill="none">
      <rect x="8" y="0" width="24" height="90" rx="8" fill="#1E293B" />
      <rect x="16" y="95" width="8" height="10" fill="#334155" />
      <circle cx="20" cy="20" r="8" fill={active === 0 ? '#EF4444' : '#7F1D1D'} className="transition-all duration-500" />
      <circle cx="20" cy="45" r="8" fill={active === 1 ? '#EAB308' : '#713F12'} className="transition-all duration-500" />
      <circle cx="20" cy="70" r="8" fill={active === 2 ? '#22C55E' : '#14532D'} className="transition-all duration-500" />
      {active === 2 && <circle cx="20" cy="70" r="12" fill="#22C55E" opacity="0.2" className="animate-ping" />}
    </svg>
  );
}

// ─── Language Toggle ────────────────────────────────────────────
function LanguageToggle() {
  const { language, setLanguage } = useLocale();
  const langs = [
    { key: 'uzLatin' as const, label: 'UZ' },
    { key: 'uz' as const, label: 'УЗ' },
    { key: 'ru' as const, label: 'RU' },
  ];

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {langs.map((l) => (
        <button
          key={l.key}
          onClick={() => setLanguage(l.key)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            language === l.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

// ─── FAQ Accordion Item ─────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-blue-100 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm pr-4">{question}</span>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────
export default function AvtoliderLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { ts } = useLocale();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: BookOpen, titleKey: 'landing.feat1Title', descKey: 'landing.feat1Desc', color: 'text-blue-600 bg-blue-50' },
    { icon: Clock, titleKey: 'landing.feat2Title', descKey: 'landing.feat2Desc', color: 'text-emerald-600 bg-emerald-50' },
    { icon: Target, titleKey: 'landing.feat3Title', descKey: 'landing.feat3Desc', color: 'text-purple-600 bg-purple-50' },
    { icon: Zap, titleKey: 'landing.feat4Title', descKey: 'landing.feat4Desc', color: 'text-amber-600 bg-amber-50' },
    { icon: BarChart3, titleKey: 'landing.feat5Title', descKey: 'landing.feat5Desc', color: 'text-rose-600 bg-rose-50' },
    { icon: Globe, titleKey: 'landing.feat6Title', descKey: 'landing.feat6Desc', color: 'text-cyan-600 bg-cyan-50' },
  ];

  const examModes = [
    { icon: Shield, titleKey: 'landing.mode1Title', descKey: 'landing.mode1Desc', badgeKey: 'landing.mode1Badge', color: 'from-blue-600 to-blue-700' },
    { icon: BookOpen, titleKey: 'landing.mode2Title', descKey: 'landing.mode2Desc', badgeKey: 'landing.mode2Badge', color: 'from-emerald-600 to-emerald-700' },
    { icon: Brain, titleKey: 'landing.mode3Title', descKey: 'landing.mode3Desc', badgeKey: 'landing.mode3Badge', color: 'from-purple-600 to-purple-700' },
  ];

  const stats = [
    { value: 1200, suffix: '+', labelKey: 'landing.statsQuestions' },
    { value: 57, suffix: '+', labelKey: 'landing.statsTickets' },
    { value: 28, suffix: '', labelKey: 'landing.statsCategories' },
    { value: 95, suffix: '%', labelKey: 'landing.statsPassRate' },
  ];

  const steps = [
    { step: 1, titleKey: 'landing.step1Title', descKey: 'landing.step1Desc', icon: Phone },
    { step: 2, titleKey: 'landing.step2Title', descKey: 'landing.step2Desc', icon: BookOpen },
    { step: 3, titleKey: 'landing.step3Title', descKey: 'landing.step3Desc', icon: BarChart3 },
    { step: 4, titleKey: 'landing.step4Title', descKey: 'landing.step4Desc', icon: Trophy },
  ];

  const testimonials = [
    { nameKey: 'landing.testimonial1Name', textKey: 'landing.testimonial1Text', locationKey: 'landing.testimonial1Location', rating: 5 },
    { nameKey: 'landing.testimonial2Name', textKey: 'landing.testimonial2Text', locationKey: 'landing.testimonial2Location', rating: 5 },
    { nameKey: 'landing.testimonial3Name', textKey: 'landing.testimonial3Text', locationKey: 'landing.testimonial3Location', rating: 5 },
  ];

  const faqs = [
    { qKey: 'landing.faq1Q', aKey: 'landing.faq1A' },
    { qKey: 'landing.faq2Q', aKey: 'landing.faq2A' },
    { qKey: 'landing.faq3Q', aKey: 'landing.faq3A' },
    { qKey: 'landing.faq4Q', aKey: 'landing.faq4A' },
  ];

  const navItems = [
    { href: '#features', labelKey: 'landing.navFeatures' },
    { href: '#modes', labelKey: 'landing.navModes' },
    { href: '#how-it-works', labelKey: 'landing.navHowItWorks' },
    { href: '#testimonials', labelKey: 'landing.navTestimonials' },
    { href: '#faq', labelKey: 'landing.navFaq' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ═══ Custom Styles ═══ */}
      <style jsx global>{`
        @keyframes car-drive {
          0% { transform: translateX(-120%) scaleX(-1); }
          100% { transform: translateX(calc(100vw + 20%)) scaleX(-1); }
        }
        @keyframes road-dash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -28; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-road-dash { animation: road-dash 1s linear infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .hero-gradient {
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 25%, #EDE9FE 50%, #FEF3C7 75%, #ECFDF5 100%);
          background-size: 300% 300%;
          animation: gradient-shift 8s ease infinite;
        }
        .glass {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 glass shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">Avto<span className="text-blue-600">Lider</span></span>
                <span className="hidden sm:inline text-[10px] text-gray-400 ml-1.5 font-medium">{ts('landing.readyForExam')}</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  {ts(item.labelKey)}
                </a>
              ))}
            </div>

            {/* CTA + Language */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageToggle />
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
                {ts('landing.login')}
              </Link>
              <Link href="/login" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5">
                {ts('landing.startBtn')}
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-2">
              <LanguageToggle />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 glass border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  {ts(item.labelKey)}
                </a>
              ))}
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <Link href="/login" className="flex-1 text-center text-sm font-medium text-gray-700 py-2.5 rounded-lg border border-gray-200">
                  {ts('landing.login')}
                </Link>
                <Link href="/login" className="flex-1 text-center text-sm font-semibold text-white bg-blue-600 py-2.5 rounded-lg">
                  {ts('landing.startBtnMobile')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 hero-gradient overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-24 left-[8%] animate-float-slow opacity-20">
            <div className="w-12 h-12 rounded-full border-4 border-red-400 flex items-center justify-center">
              <span className="text-red-400 font-bold text-xs">60</span>
            </div>
          </div>
          <div className="absolute top-40 right-[12%] animate-float opacity-15">
            <div className="w-14 h-14 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">P</div>
          </div>
          <div className="absolute bottom-32 left-[15%] animate-float opacity-15">
            <svg viewBox="0 0 40 40" className="w-10 h-10">
              <polygon points="20,2 38,38 2,38" fill="none" stroke="#F59E0B" strokeWidth="3" />
              <text x="20" y="30" textAnchor="middle" fill="#F59E0B" fontSize="16" fontWeight="bold">!</text>
            </svg>
          </div>
          <div className="absolute bottom-20 right-[20%] animate-float-slow opacity-15">
            <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
          <svg className="absolute bottom-0 left-0 right-0 w-full h-4 opacity-20" preserveAspectRatio="none">
            <line x1="0" y1="2" x2="100%" y2="2" stroke="#94A3B8" strokeWidth="2" strokeDasharray="12 8" className="animate-road-dash" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  {ts('landing.badge')}
                </div>
              </FadeIn>

              <FadeIn delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  {ts('landing.heroTitle1')}{' '}
                  <span className="relative">
                    <span className="relative z-10 text-blue-600">{ts('landing.heroTitle2')}</span>
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-200" viewBox="0 0 200 12" fill="none">
                      <path d="M2 8 Q50 2 100 8 Q150 14 198 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </span>{' '}
                  {ts('landing.heroTitle3')}
                </h1>
              </FadeIn>

              <FadeIn delay={200}>
                <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {ts('landing.heroDesc')}
                </p>
              </FadeIn>

              <FadeIn delay={300}>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 group">
                    {ts('landing.startFree')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href="#modes" className="inline-flex items-center justify-center gap-2 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 px-8 py-3.5 rounded-xl border border-gray-200 transition-all hover:-translate-y-0.5 shadow-sm">
                    <Play className="w-4 h-4" />
                    {ts('landing.howItWorks')}
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-700">5000+</span> {ts('landing.usersCount')}
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right: Phone mockup */}
            <FadeIn delay={300} className="relative hidden lg:block">
              <div className="relative">
                <div className="relative mx-auto w-80 h-[480px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden p-3">
                  <div className="w-full h-full bg-gradient-to-b from-blue-50 to-white rounded-[2rem] overflow-hidden relative">
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                      <span className="text-xs font-semibold text-gray-600">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-2.5 rounded-sm border border-gray-400 relative">
                          <div className="absolute inset-0.5 bg-green-500 rounded-[1px]" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pt-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-sm">AvtoLider</span>
                      </div>
                      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{ts('landing.phoneMockQ')}</span>
                          <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 18:42
                          </span>
                        </div>
                        <div className="w-full h-20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-3 flex items-center justify-center">
                          <svg viewBox="0 0 80 40" className="w-16 h-8 opacity-60">
                            <circle cx="20" cy="20" r="15" fill="none" stroke="#3B82F6" strokeWidth="2" />
                            <text x="20" y="25" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">30</text>
                            <line x1="40" y1="20" x2="75" y2="20" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed mb-3">{ts('landing.phoneMockText')}</p>
                        {[ts('landing.phoneMockOpt1'), ts('landing.phoneMockOpt2'), ts('landing.phoneMockOpt3'), ts('landing.phoneMockOpt4')].map((opt, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg mb-1.5 text-xs transition-all ${i === 2 ? 'bg-green-50 border border-green-200 text-green-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${i === 2 ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                              {i === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 animate-float">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{ts('landing.phoneMockCorrect')}</p>
                      <p className="text-[10px] text-green-600 font-medium">{ts('landing.phoneMockPassed')}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-2 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 animate-float-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{ts('landing.phoneMockStreak')}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{ts('landing.phoneMockGreat')}</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-8 -left-12">
                  <TrafficLight />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Animated Uzbek cars parade */}
        <CarParade />
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-6 bg-white border-y border-gray-100 relative -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
            {stats.map((stat, i) => (
              <FadeIn key={stat.labelKey} delay={i * 100}>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-extrabold text-gray-900">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{ts(stat.labelKey)}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">{ts('landing.featuresLabel')}</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight">{ts('landing.featuresTitle')}</h2>
              <p className="text-gray-500 mt-4 text-lg">{ts('landing.featuresDesc')}</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.titleKey} delay={i * 80}>
                <div className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1 bg-white">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{ts(f.titleKey)}</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">{ts(f.descKey)}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EXAM MODES ═══ */}
      <section id="modes" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">{ts('landing.modesLabel')}</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight">{ts('landing.modesTitle')}</h2>
              <p className="text-gray-500 mt-4 text-lg">{ts('landing.modesDesc')}</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {examModes.map((mode, i) => (
              <FadeIn key={mode.titleKey} delay={i * 120}>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity" />
                  <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                    <span className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      {ts(mode.badgeKey)}
                    </span>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-5 shadow-lg`}>
                      <mode.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{ts(mode.titleKey)}</h3>
                    <p className="text-gray-500 mt-3 text-sm leading-relaxed flex-1">{ts(mode.descKey)}</p>
                    <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 group/link">
                      {ts('landing.tryIt')}
                      <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">{ts('landing.howLabel')}</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight">{ts('landing.howTitle')}</h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <FadeIn key={s.step} delay={i * 120}>
                <div className="relative text-center group">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-200 to-blue-100" />
                  )}
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300 mb-5">
                      <s.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold -mt-3 mb-3 shadow-lg">
                      {s.step}
                    </div>
                    <h3 className="font-bold text-gray-900">{ts(s.titleKey)}</h3>
                    <p className="text-gray-500 text-sm mt-2">{ts(s.descKey)}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">{ts('landing.testimonialsLabel')}</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight">{ts('landing.testimonialsTitle')}</h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={t.nameKey} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{ts(t.textKey)}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {ts(t.nameKey).charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{ts(t.nameKey)}</p>
                      <p className="text-xs text-gray-400">{ts(t.locationKey)}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ROAD DIVIDER WITH REAL CARS ═══ */}
      <div className="relative h-24 bg-gray-700 overflow-hidden">
        {/* Road surface — full width, tall enough for cars */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800" />
        {/* Road edges */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400" />
        {/* Center dashed yellow line */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#FDE047" strokeWidth="3" strokeDasharray="24 16" className="animate-road-dash" />
        </svg>
        {/* Blue Toyota — top lane */}
        <div className="absolute top-1" style={{ animation: 'car-drive 12s linear infinite', animationDelay: '-2s' }}>
          <img src={CAR_IMAGES[3]} alt="" className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" draggable={false} />
        </div>
        {/* Dark Audi R8 — bottom lane, fast */}
        <div className="absolute bottom-2" style={{ animation: 'car-drive 10s linear infinite', animationDelay: '-7s' }}>
          <img src={CAR_IMAGES[4]} alt="" className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" draggable={false} />
        </div>
        {/* White Toyota — top lane, slow */}
        <div className="absolute top-2" style={{ animation: 'car-drive 18s linear infinite', animationDelay: '-14s' }}>
          <img src={CAR_IMAGES[2]} alt="" className="h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" draggable={false} />
        </div>
      </div>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">{ts('landing.faqLabel')}</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 tracking-tight">{ts('landing.faqTitle')}</h2>
            </div>
          </FadeIn>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FadeIn key={faq.qKey} delay={i * 80}>
                <FAQItem question={ts(faq.qKey)} answer={ts(faq.aKey)} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 border border-white/10">
              <Zap className="w-4 h-4" />
              {ts('landing.ctaBadge')}
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight">{ts('landing.ctaTitle')}</h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-blue-100 mt-5 text-lg max-w-xl mx-auto">{ts('landing.ctaDesc')}</p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 px-8 py-4 rounded-xl transition-all shadow-xl hover:-translate-y-0.5 group">
                {ts('landing.ctaRegister')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="https://t.me/avtolider_uz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl transition-all border border-white/20">
                <Send className="w-4 h-4" />
                {ts('landing.ctaTelegram')}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">Avto<span className="text-blue-500">Lider</span></span>
              </div>
              <p className="text-sm leading-relaxed">{ts('landing.footerDesc')}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">{ts('landing.footerPlatform')}</h4>
              <ul className="space-y-2.5">
                {[ts('landing.footerExamMode'), ts('landing.footerTicketMode'), ts('landing.footerMarathon'), ts('landing.footerStats')].map((item) => (
                  <li key={item}><Link href="/login" className="text-sm hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">{ts('landing.footerInfo')}</h4>
              <ul className="space-y-2.5">
                {[
                  { label: ts('landing.footerPricing'), href: '/pricing' },
                  { label: ts('landing.footerAbout'), href: '/about' },
                  { label: 'FAQ', href: '#faq' },
                ].map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-sm hover:text-white transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">{ts('landing.footerContact')}</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-blue-500" /> +998 90 123 45 67</li>
                <li className="flex items-center gap-2 text-sm"><Send className="w-4 h-4 text-blue-500" /> @avtolider_uz</li>
                <li className="flex items-center gap-2 text-sm"><MessageCircle className="w-4 h-4 text-blue-500" /> Telegram bot</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
            <p className="text-xs">&copy; 2024-2026 AvtoLider. {ts('landing.footerRights')}</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> {ts('landing.footerAllDevices')}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {ts('landing.footerLangs')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
