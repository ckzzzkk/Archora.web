export type Tier = 'starter' | 'creator' | 'pro' | 'architect';
export type BillingInterval = 'monthly' | 'annual';

export const PRICING: Record<Tier, {
  monthly: number;
  annual: number;
  annualTotal: number;
  label: string;
  badge: string | null;
  color: string;
  description: string;
}> = {
  starter: {
    monthly: 0, annual: 0, annualTotal: 0,
    label: 'Starter', badge: null, color: '#4A8080',
    description: 'Get started with AI-powered architecture design',
  },
  creator: {
    monthly: 14.99, annual: 11.99, annualTotal: 143.90,
    label: 'Creator', badge: 'Most Popular', color: '#C9FFFD',
    description: 'Unlock the full creative toolkit',
  },
  pro: {
    monthly: 24.99, annual: 19.99, annualTotal: 239.90,
    label: 'Pro', badge: null, color: '#7AB87A',
    description: 'Professional-grade design and AR tools',
  },
  architect: {
    monthly: 39.99, annual: 31.99, annualTotal: 383.90,
    label: 'Architect', badge: null, color: '#FFEE8C',
    description: 'Unlimited power for serious architects',
  },
};

export const STRIPE_PRICE_IDS: Record<string, string> = {
  creator_monthly:   process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY   ?? '',
  creator_annual:    process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL    ?? '',
  pro_monthly:       process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY       ?? '',
  pro_annual:        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL        ?? '',
  architect_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_MONTHLY ?? '',
  architect_annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_ANNUAL  ?? '',
};

export interface FeatureRow {
  label: string;
  starter: string;
  creator: string;
  pro: string;
  architect: string;
}

export const FEATURE_COMPARISON: FeatureRow[] = [
  { label: 'Projects',          starter: '3',         creator: '25',        pro: '50',        architect: 'Unlimited' },
  { label: 'Rooms per project', starter: '4',         creator: '15',        pro: '20',        architect: 'Unlimited' },
  { label: 'AI designs / month',starter: '10',        creator: '200',       pro: '500',       architect: 'Unlimited' },
  { label: 'Design styles',     starter: '3',         creator: 'All 12',    pro: 'All 12',    architect: 'All 12' },
  { label: 'Floors',            starter: '1',         creator: '5',         pro: '10',        architect: 'Unlimited' },
  { label: 'AR modes',          starter: 'None',      creator: 'Placement', pro: 'All modes', architect: 'All modes' },
  { label: 'Auto-save',         starter: 'Manual',    creator: '120s',      pro: '60s',       architect: '30s' },
  { label: 'Daily edit time',   starter: '45 min',    creator: 'Unlimited', pro: 'Unlimited', architect: 'Unlimited' },
  { label: 'Undo steps',        starter: '10',        creator: '50',        pro: '100',       architect: 'Unlimited' },
  { label: 'Community',         starter: 'Read-only', creator: 'Publish',   pro: 'Publish',   architect: 'Publish' },
  { label: 'Template revenue',  starter: '—',         creator: '60%',       pro: '60%',       architect: '80%' },
  { label: 'CAD export',        starter: 'No',        creator: 'No',        pro: 'No',        architect: 'Yes' },
  { label: 'VIP support',       starter: 'No',        creator: 'No',        pro: 'No',        architect: 'Yes' },
];

export const TIER_PERKS: Record<Tier, string[]> = {
  starter: ['3 projects', '10 AI designs/month', '3 design styles', 'Community read-only'],
  creator: ['25 projects', '200 AI designs/month', 'All 12 styles', 'AR furniture placement', 'Auto-save', 'Publish to community'],
  pro: ['50 projects', '500 AI designs/month', 'All AR modes', 'Custom furniture', '60s auto-save', 'AI image references'],
  architect: ['Unlimited everything', 'CAD export', 'Custom AI furniture', 'Team collaboration', '80% template revenue', 'VIP support'],
};
