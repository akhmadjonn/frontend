import Link from 'next/link';
import { Check } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228/api/v1';

interface LocalizedText {
  uz: string;
  uzLatin: string;
  ru: string;
}

interface Plan {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  priceInTiyins: number;
  durationDays: number;
  features: LocalizedText[];
}

function formatPrice(tiyins: number): string {
  const sum = tiyins / 100;
  return sum.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

function getPlanBadge(durationDays: number): string | null {
  if (durationDays === 30) return 'Ommabop';
  if (durationDays >= 90) return 'Tejamkor';
  return null;
}

async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/plans?language=UzLatin`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? (data.data ?? []) : [];
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Obuna rejalari</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            O&apos;zingizga mos rejani tanlang va imtihonga tayyorlanishni boshlang
          </p>
        </div>

        {/* Free tier */}
        <div className="mb-8 rounded-xl border p-6 text-center">
          <h3 className="text-lg font-bold">Bepul</h3>
          <p className="text-3xl font-extrabold tracking-tight mt-2">0 so&apos;m</p>
          <p className="text-sm text-muted-foreground mt-1">Cheklangan kunlik imtihonlar</p>
          <ul className="mt-4 space-y-2 text-sm text-left max-w-xs mx-auto">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600 shrink-0" /> Kunlik bepul imtihonlar</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600 shrink-0" /> Kategoriyalar bo&apos;yicha mashq</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600 shrink-0" /> Progress ko&apos;rish</li>
          </ul>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-primary px-6 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Boshlash
            </Link>
          </div>
        </div>

        {/* Paid plans */}
        {plans.length > 0 && (
          <div className={`grid gap-4 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {plans.map((plan) => {
              const badge = getPlanBadge(plan.durationDays);
              const isPopular = plan.durationDays === 30;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 ${isPopular ? 'border-foreground overflow-visible' : 'border-border'}`}
                >
                  {badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-foreground px-3 py-0.5 text-[11px] font-bold text-background">
                        {badge}
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-lg font-bold">{plan.name.uzLatin}</h3>
                    <div className="mt-3">
                      <span className="text-3xl font-extrabold tracking-tight">{formatPrice(plan.priceInTiyins)}</span>
                      <span className="text-sm text-muted-foreground ml-1">so&apos;m</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.durationDays} kun</p>
                  </div>

                  {plan.features.length > 0 && (
                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{feature.uzLatin}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6">
                    <Link
                      href="/subscription"
                      className={`block w-full text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isPopular
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border border-primary text-primary hover:bg-primary/5'
                      }`}
                    >
                      Obuna bo&apos;lish
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {plans.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Rejalar yuklanmoqda...</p>
        )}
      </div>
    </div>
  );
}
