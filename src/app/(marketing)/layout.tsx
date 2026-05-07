import ContactFab from '@/components/marketing/contact-fab';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ContactFab />
    </>
  );
}
