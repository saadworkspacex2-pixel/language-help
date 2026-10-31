import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Reveal, ScaleIn } from '@/components/motion';
import ContactForm from '@/components/site/contact-form';
import { getSiteInfo } from '@/lib/actions/public';

export default async function ContactSection() {
  const info = await getSiteInfo();
  const items = [
    { icon: Phone, label: 'Call us', value: info.phone, href: `tel:${info.phone.replace(/\s/g, '')}` },
    { icon: Mail, label: 'Email', value: info.email, href: `mailto:${info.email}` },
    { icon: MapPin, label: 'Visit', value: info.address },
    { icon: Clock, label: 'Office hours', value: 'Sat – Thu · 10:00 AM – 8:00 PM' },
  ];
  return (
    <section id="contact" className="relative py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Reveal><p className="eyebrow">Contact</p></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.2rem)] font-[800] leading-[1.05] tracking-[-0.03em] text-[#202026]">
              Let&apos;s plan your
              <span className="font-serif-accent font-normal italic tracking-normal text-[#E51A24]"> language journey.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#65656B]">
              Questions about a course, batch timing or fees? Message us — or say hello on WhatsApp for the fastest reply.
            </p>
          </Reveal>

          <div className="mt-9 grid gap-3.5 sm:grid-cols-2">
            {items.map((it, i) => (
              <Reveal key={it.label} delay={0.05 * i}>
                <div className="glass-soft rounded-[22px] p-5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-[#BEC0C6] text-[#C8151F]"
                    style={{
                      backgroundImage: 'linear-gradient(180deg,#FFFFFF,#F4F6F9)',
                      boxShadow: 'inset 0 1px 0 #fff, 0 2px 4px rgba(52, 52, 58,.16)',
                    }}
                  >
                    <it.icon size={16} />
                  </span>
                  <p className="mt-3 text-[11px] font-[750] uppercase tracking-[0.14em] text-[#8C8E94]">{it.label}</p>
                  {it.href ? (
                    <a href={it.href} className="mt-0.5 block text-[13.5px] font-[700] leading-snug text-[#202026] hover:text-[#C8151F]">{it.value}</a>
                  ) : (
                    <p className="mt-0.5 text-[13.5px] font-[700] leading-snug text-[#202026]">{it.value}</p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <a
              href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent('Hello Language Help BD! I would like to know more about your courses.')}`}
              target="_blank"
              className="btn btn-dark btn-md mt-6 gap-2"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </Reveal>
        </div>

        <ScaleIn delay={0.1}>
          <ContactForm />
        </ScaleIn>
      </div>
    </section>
  );
}
