/** All editable website content lives here as defaults, overridable from the admin CMS. */
export const CONTENT_DEFAULTS: Record<string, string> = {
  // ---------- Brand ----------
  brand_name: 'Language Help',
  brand_accent: 'BD',
  brand_logo: '/logo.svg',

  // ---------- Hero ----------
  hero_badge: 'Admissions open — 2026 batches',
  hero_title_1: 'Speak to the world',
  hero_title_2: 'in its own',
  hero_title_accent: 'language.',
  hero_subtitle:
    'Language Help BD is a modern language training institution — English, IELTS, Japanese, Korean and Arabic, taught in small batches with personal feedback, structured 22-class programs and certificates of completion.',
  hero_cta_primary: 'Explore Courses',
  hero_cta_secondary: 'Book Free Counseling',
  hero_bg_image: 'https://images.pexels.com/photos/6503100/pexels-photo-6503100.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1080&w=1920',
  hero_overlay: '72',
  hero_align: 'center',
  hero_image_1: 'https://images.pexels.com/photos/6503100/pexels-photo-6503100.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200',
  hero_image_2: 'https://images.pexels.com/photos/6502822/pexels-photo-6502822.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  hero_stats: '2,400+ :: Learners trained\n6+ :: Languages & programs\n98% :: Completion rate',
  hero_card_title: 'Certificate of',
  hero_card_sub: 'Completion, on merit',
  hero_badge_number: '22',
  hero_badge_label: 'classes per program',
  hero_pill: 'Small batches · Personal feedback',
  hero_marquee: 'English, IELTS, 日本語 Japanese, 한국어 Korean, العربية Arabic, Spoken English, Grammar, Phonetics',

  // ---------- About ----------
  about_eyebrow: 'About Language Help BD',
  about_title: 'We don’t just teach grammar.',
  about_title_accent: 'We build',
  about_title_end: 'confidence to speak.',
  about_body:
    'Language Help BD began with a simple belief — anyone in Bangladesh can master a foreign language with the right mentoring. Today, our classrooms in Dhaka run structured programs in English, IELTS, Japanese, Korean and Arabic, designed around conversation, culture and real-world fluency.',
  about_stats: '8+ :: Years of teaching\n2,400+ :: Students guided\n40+ :: Batches completed\n4.9/5 :: Learner rating',
  about_cta: 'Visit our campus',
  about_quote: 'Every learner deserves a mentor who notices them. That is what small batches make possible.',
  about_quote_author: '— Founder, Language Help BD',
  about_image_1: 'https://images.pexels.com/photos/6503155/pexels-photo-6503155.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  about_image_2: 'https://images.pexels.com/photos/7092455/pexels-photo-7092455.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  about_image_3: 'https://images.pexels.com/photos/37795357/pexels-photo-37795357.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',

  // ---------- Courses section ----------
  courses_eyebrow: 'Our Courses',
  courses_title: 'Programs designed like',
  courses_title_accent: 'products.',

  // ---------- People section ----------
  people_eyebrow: 'The People',
  people_title: 'Mentors who make',
  people_title_accent: 'fluency happen.',

  // ---------- Why choose ----------
  why_eyebrow: 'Why Language Help BD',
  why_title: 'Built differently,',
  why_title_accent: 'on purpose.',
  why_items:
    'Small, focused batches :: Mentors know every learner by name — no one disappears in the crowd.\n' +
    'Structured 22-class programs :: A clear roadmap from day one to your certificate. You always know what’s next.\n' +
    'Homework with real marking :: Submit homework from your phone and get it personally reviewed by your mentor.\n' +
    'Conversation-first method :: Speak from class one. Language lives in dialogue, not in memorised rules.\n' +
    'Certificate of Completion :: Automatically issued once you complete every class of your program.\n' +
    'A campus you’ll love :: Bright, modern classrooms designed for focus, comfort and creativity.',

  // ---------- Gallery / branches ----------
  gallery_eyebrow: 'Campus Life',
  gallery_title: 'Moments from',
  gallery_title_accent: 'the classroom.',
  branches_eyebrow: 'Find Us',
  branches_title: 'Our campus,',
  branches_title_accent: 'in the heart of Dhaka.',

  // ---------- Footer ----------
  footer_tagline: 'A modern language training institution helping Bangladesh speak to the world — one language at a time.',
};

export type SiteContent = Record<string, string>;

/** Parse "Left :: Right" lines into pairs. */
export function parsePairs(value: string): { a: string; b: string }[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, ...rest] = line.split('::');
      return { a: (a ?? '').trim(), b: rest.join('::').trim() };
    });
}
