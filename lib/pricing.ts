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
  taglines: string[];
}> = {
  starter: {
    monthly: 0, annual: 0, annualTotal: 0,
    label: 'Starter', badge: null, color: '#9A9590',
    description: 'Start creating — no credit card needed. Sketch your ideas and explore at your own pace.',
    taglines: ['Manual architecture design', 'Community read-only access', 'Export with watermark'],
  },
  creator: {
    monthly: 24.99, annual: 17.49, annualTotal: 209.90,
    label: 'Creator', badge: 'Most Popular', color: '#C8C8C8',
    description: 'AI-assisted designs. Unlock your full creative toolkit with 40 generations per month.',
    taglines: ['AI-powered designs', 'All 12 design styles', 'AR furniture placement'],
  },
  pro: {
    monthly: 34.99, annual: 22.49, annualTotal: 269.90,
    label: 'Pro', badge: 'Professional', color: '#D4A84B',
    description: 'Advanced AI editing. Watermark-free renders, unlimited AR, and professional-grade exports.',
    taglines: ['Advanced AI models', 'Unlimited AR all modes', 'Watermark-free cinematic tours'],
  },
  architect: {
    monthly: 49.99, annual: 34.49, annualTotal: 413.90,
    label: 'Architect', badge: null, color: '#C8C8C8',
    description: 'Our most capable AI models. AI custom furniture, co-design, CAD export, and dedicated VIP support.',
    taglines: ['Most capable AI designs', 'AI custom furniture', 'Co-design & team collaboration'],
  },
};

/** Biggest percentage saved by paying annually across the paid tiers, derived from PRICING so it can never drift. */
export function maxAnnualSavingPercent(): number {
  const tiers: Tier[] = ['creator', 'pro', 'architect'];
  return Math.max(...tiers.map((t) => {
    const full = PRICING[t].monthly * 12;
    return Math.round(((full - PRICING[t].annualTotal) / full) * 100);
  }));
}

export interface FeatureRow {
  label: string;
  starter: string;
  creator: string;
  pro: string;
  architect: string;
}

export const FEATURE_COMPARISON: FeatureRow[] = [
  // Projects & Rooms
  { label: 'Projects',             starter: '1',        creator: '25',         pro: '50',          architect: '100'        },
  { label: 'Rooms per project',   starter: '2',        creator: '15',         pro: '20',          architect: '50'        },
  { label: 'Floors per project',  starter: '1',        creator: '5',          pro: '10',          architect: '20'        },
  { label: 'Furniture per room',  starter: '5',        creator: '50',         pro: '100',         architect: 'Unlimited' },
  // AI Generation
  { label: 'AI designs/month',     starter: '0',        creator: '40',          pro: '100',         architect: '300'       },
  { label: 'AI edits/month',       starter: '0',        creator: '30',          pro: '80',          architect: '300'       },
  { label: 'AI chat (per day)',    starter: '0',        creator: '25',          pro: 'Unlimited',   architect: '200'       },
  { label: 'AI model',             starter: '—',        creator: 'Standard',    pro: 'Advanced',     architect: 'Most capable' },
  // AR
  { label: 'AR furniture placement', starter: 'No',   creator: 'Yes',         pro: 'Yes',         architect: 'Yes'       },
  { label: 'AR scan & measure',    starter: 'No',      creator: 'No',          pro: 'Yes',         architect: 'Yes'       },
  { label: 'AR scans/month',       starter: '0',        creator: '15',          pro: 'Unlimited',   architect: '100'      },
  // Renders & Exports
  { label: 'Renders/month',        starter: '0',        creator: '5',           pro: '30',          architect: '100'       },
  { label: 'Exports/month',        starter: '1',        creator: '20',          pro: 'Unlimited',   architect: '50'       },
  { label: 'Export watermark',    starter: 'Yes',      creator: 'No',          pro: 'No',          architect: 'No'        },
  { label: 'CAD export',          starter: 'No',        creator: 'No',          pro: 'No',          architect: 'Yes'       },
  // Design Tools
  { label: 'Design styles',       starter: '3',         creator: 'All 12',      pro: 'All 12',      architect: 'All 12'    },
  { label: 'Custom textures (AI)', starter: 'No',      creator: 'No',          pro: 'Yes',         architect: 'Yes'       },
  { label: 'AI custom furniture',  starter: 'No',       creator: 'No',          pro: 'No',          architect: 'Yes'       },
  { label: 'Batch generation',     starter: 'No',       creator: 'No',          pro: 'Yes (3)',     architect: 'Yes (5)'   },
  // 3D & Walkthrough
  { label: '3D walkthrough mode',  starter: 'No',       creator: 'Yes',          pro: 'Yes',         architect: 'Yes'       },
  { label: 'Cinematic tour',       starter: 'No',       creator: 'Yes (watermark)', pro: 'Yes',   architect: 'Yes'       },
  { label: 'First-person 3D',      starter: 'No',      creator: '30 min',      pro: 'Unlimited',   architect: '300 min'  },
  // Editing
  { label: 'Auto-save',           starter: 'Manual',   creator: '120s',        pro: '60s',         architect: '30s'       },
  { label: 'Daily edit time',    starter: '15 min',   creator: 'Unlimited',   pro: 'Unlimited',   architect: 'Unlimited' },
  { label: 'Undo steps',          starter: '5',        creator: '50',          pro: '100',         architect: 'Unlimited'},
  // Collaboration
  { label: 'Collaborators',        starter: '0',        creator: '1',           pro: '1',           architect: '5'         },
  { label: 'Co-design sessions',  starter: 'No',       creator: 'No',           pro: 'No',          architect: 'Yes'       },
  // Community
  { label: 'Community access',    starter: 'Read-only', creator: 'Publish',    pro: 'Publish',     architect: 'Publish'   },
  { label: 'Publish templates',    starter: 'No',       creator: 'Yes (5)',      pro: 'Unlimited',   architect: 'Unlimited' },
  { label: 'Template revenue share', starter: '—',      creator: '60%',          pro: '60%',         architect: '70%'       },
  // Support & Other
  { label: 'VIP support',          starter: 'No',       creator: 'No',           pro: 'No',          architect: 'Yes'       },
  { label: 'Commercial buildings',  starter: 'No',       creator: 'No',           pro: 'Yes',         architect: 'Yes'       },
  { label: 'Building code compliance', starter: 'No',    creator: 'No',          pro: 'Yes',         architect: 'Yes'       },
  { label: 'Cost estimator',       starter: 'No',       creator: 'No',           pro: 'Yes',         architect: 'Yes'       },
];

export const TIER_PERKS: Record<Tier, string[]> = {
  starter: [
    '1 project, 2 rooms',
    'Manual design (no AI)',
    '3 design styles',
    'Community read-only',
    '1 export/month (watermark)',
  ],
  creator: [
    '25 projects, 15 rooms/project',
    '40 AI designs/month',
    'All 12 design styles',
    'AR furniture placement',
    '5 renders/month',
    'Auto-save 120s',
    'Publish 5 templates (60% revenue)',
  ],
  pro: [
    '50 projects, 20 rooms/project',
    '100 AI designs + 80 edits/month',
    'Advanced AI models',
    'Unlimited AR all modes',
    '30 renders/month (no watermark)',
    'Custom textures (AI)',
    'First-person 3D walkthrough',
    'Unlimited exports',
  ],
  architect: [
    '100 projects, 50 rooms/project',
    '300 AI designs + 300 edits/month',
    'Most capable AI models',
    'AI custom furniture',
    'Co-design with 5 collaborators',
    '100 renders + 50 exports/month',
    'CAD export & cost estimator',
    '70% template revenue share',
    'VIP support',
  ],
};
