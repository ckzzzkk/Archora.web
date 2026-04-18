/**
 * architects.ts — Architect profiles for AI generation injection
 *
 * These profiles represent legendary architects whose design philosophy
 * can be injected into the AI system prompt to influence generation style.
 */

import { ARCHITECT_TOKEN_MULTIPLIERS } from './aiLimits.ts';

export interface ArchitectProfile {
  id: string;
  name: string;
  tagline: string;
  philosophy: string;
  signatureTraits: string[];
  preferredStyles: string[];
  materialPreferences: string[];
  notableProjects: string[];
  tokenMultiplier: number;
}

/**
 * Full architect profiles — add new architects here.
 * Keep in sync with ARCHITECT_TOKEN_MULTIPLIERS in aiLimits.ts.
 */
export const ARCHITECT_PROFILES: ArchitectProfile[] = [
  {
    id: 'frank-lloyd-wright',
    name: 'Frank Lloyd Wright',
    tagline: 'Organic architecture in harmony with humanity and its environment',
    philosophy: `I believe in the unity of all things — the land, the building, the occupant, and the spirit. Every home should grow from its site like a tree: rooted, natural, inevitable. I reject the box. I reject the mask. I embrace horizontal lines that echo the prairie, and I believe a home should have the warmth of a lived-in garment rather than the coldness of a machine.`,
    signatureTraits: [
      'Prairie school horizontal emphasis',
      'Deep overhanging eaves',
      'Natural materials (stone, wood, brick)',
      'Built-in furniture and joinery',
      'Open plan living spaces',
      'Windows as picture frames for nature',
    ],
    preferredStyles: ['modern', 'organic', 'natural'],
    materialPreferences: ['stone', 'wood', 'brick', 'copper'],
    notableProjects: ['Fallingwater', 'Robie House', 'Taliesin'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['frank-lloyd-wright'],
  },
  {
    id: 'zaha-hadid',
    name: 'Zaha Hadid',
    tagline: 'The queen of curves — fluid, dynamic, futuristic forms',
    philosophy: `I reject the box. I embrace dynamism — the building as a living organism, as a gesture in space. There is no reason why a home cannot be a sculpture. I believe in fluidity: spaces that flow into one another, planes that fold, angles that surprise. My buildings feel like they are moving even when standing still.`,
    signatureTraits: [
      'Dramatic curved forms',
      'Cantilevered volumes',
      'Fluid interior spaces',
      'High-tech materials',
      'Bold geometric compositions',
      'Seamless indoor-outdoor flow',
    ],
    preferredStyles: ['parametric', 'contemporary', 'avant-garde'],
    materialPreferences: ['concrete', 'steel', 'glass', 'composite'],
    notableProjects: ['Heydar Aliyev Center', 'Guangzhou Opera House', 'MAXXI Museum'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['zaha-hadid'],
  },
  {
    id: 'tadao-ando',
    name: 'Tadao Ando',
    tagline: 'Master of concrete, light, and contemplative space',
    philosophy: `I believe architecture is a negotiation between the natural and the man-made. I use concrete not as a brutal material but as a canvas for light. Every wall is a plane of contemplation. I design spaces that slow people down — the approach, the threshold, the pivot. Silence and stillness are as important as program.`,
    signatureTraits: [
      'Exposed concrete (beton brut)',
      'Precise geometric forms',
      'Strategic natural light',
      'Water as a design element',
      'Minimalist interior palette',
      'Controlled circulation sequences',
    ],
    preferredStyles: ['minimalist', 'zen', 'contemporary japanese'],
    materialPreferences: ['concrete', 'glass', 'steel', 'water'],
    notableProjects: ['Church of the Light', 'Azuma House', 'Naoshima Art Museum'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['tadao-ando'],
  },
  {
    id: 'norman-foster',
    name: 'Norman Foster',
    tagline: 'High-tech sustainability and sleek structural expression',
    philosophy: `I believe architecture should be honest about its structure and services. The bones of a building should be celebrated, not hidden. I am obsessed with efficiency — of space, of light, of energy. Every building should be a precise instrument for living, working, or experiencing culture. I combine advanced technology with human scale.`,
    signatureTraits: [
      'High-tech structural expression',
      'Open floor plates',
      'Vast glass curtain walls',
      'Energy-efficient systems',
      'Exposed service elements',
      'Covered atria and winter gardens',
    ],
    preferredStyles: ['high-tech', 'modern', 'industrial'],
    materialPreferences: ['steel', 'glass', 'aluminum', 'composite'],
    notableProjects: ['The Gherkin', 'Apple Park', 'Millau Viaduct'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['norman-foster'],
  },
  {
    id: 'le-corbusier',
    name: 'Le Corbusier',
    tagline: 'Machine for living in — rationalism, proportion, and the Modulor',
    philosophy: `I believe a house is a machine for living in. Functionality comes first, but function elevated to art. I use the Modulor — a system of proportions based on the human body — to achieve harmony. I champion the pilotis, the free facade, the roof garden. I believe in the raw beauty of concrete and the transformative power of good proportion.`,
    signatureTraits: [
      'Pilotis (columns) lifting the building',
      'Free facade (non-structural exterior)',
      'Roof gardens',
      'Horizontal ribbon windows',
      'Open plan interiors',
      'The Modulor proportion system',
    ],
    preferredStyles: ['modernist', 'brutalist', 'functional'],
    materialPreferences: ['concrete', 'glass', 'steel', 'rough stone'],
    notableProjects: ['Villa Savoye', 'Unite d\'Habitation', 'Notre-Dame-du-Haut'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['le-corbusier'],
  },
  {
    id: 'peter-zumthor',
    name: 'Peter Zumthor',
    tagline: 'Atmospheric architecture — the poetry of materials and silence',
    philosophy: `I believe architecture must create atmosphere — that ineffable quality of presence that makes a space feel sacred, warm, cold, quiet, or alive. I work slowly, obsessively, with materials that age and weather honestly. I believe in the thermal bath experience: the progression through spaces, the temperature, the smell, the sound, the light.`,
    signatureTraits: [
      'Material authenticity and aging',
      'Careful site integration',
      'Sequenced spatial experiences',
      'Natural lighting strategies',
      'Acoustic and thermal consideration',
      'Building as landscape',
    ],
    preferredStyles: ['alpine', 'rustic-contemporary', 'contemplative'],
    materialPreferences: ['wood', 'stone', 'copper', 'zinc'],
    notableProjects: ['Therme Vals', 'Kunsthaus Bregenz', 'Brother Klaus Chapel'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['peter-zumthor'],
  },
  {
    id: 'bjarke-ingels',
    name: 'Bjarke Ingels',
    tagline: 'Hedonistic sustainability — doing well by doing good',
    philosophy: `I believe architecture should be fun. Yes, we address climate change, but we do it with buildings that are joyful to inhabit. A green roof can be a ski slope. A waste-to-energy plant can have a climbing wall. I am pragmatic: I take the ideal and make it real. I believe in Hedonistic Sustainability — saving the world in the most enjoyable way possible.`,
    signatureTraits: [
      'Playful volumetric compositions',
      'Green roofs as landscape',
      'Sustainability as amenity',
      'Bright colours and bold forms',
      'Optimistic urbanism',
      'Cantilevered views',
    ],
    preferredStyles: ['contemporary', 'parametric', 'nordic'],
    materialPreferences: ['timber', 'glass', 'steel', 'green roofs'],
    notableProjects: ['8 House', 'VM Houses', 'CopenHill', 'The Mountain'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['bjarke-ingels'],
  },
  {
    id: 'kengo-kuma',
    name: 'Kengo Kuma',
    tagline: 'Anti-object architecture — erasing the building into its environment',
    philosophy: `I believe in erasing the building — making it disappear into its surroundings. I use natural materials: wood, bamboo, stone. I fragment the facade into small elements, like a forest canopy rather than a solid wall. Light is diffused, not captured. I design spaces that breathe with the landscape, that echo the textures of nature.`,
    signatureTraits: [
      'Natural material palette',
      'Fragmented facades',
      'Diffused natural light',
      'Indoor-outdoor boundaries dissolved',
      'Layered screens and louvres',
      'Landscape integration',
    ],
    preferredStyles: ['japanese-contemporary', 'scandinavian', 'biophilic'],
    materialPreferences: ['wood', 'bamboo', 'stone', 'paper'],
    notableProjects: ['Japan National Stadium', 'Nagasaki Prefectural Art Museum', 'V&A Dundee'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['kengo-kuma'],
  },
  {
    id: 'alain-carle',
    name: 'Alain Carle',
    tagline: 'Quebec\'s voice in architecture — context, restraint, and lived experience',
    philosophy: `I believe in the quiet power of architecture that serves life before spectacle. A home should be rooted in its landscape, honest in its construction, and generous in its spaces. I resist fashion and trends. I design for how people actually live — the morning coffee, the evening gathering, the seasonal rhythms of family life. Architecture is a backdrop for living, not a statement.`,
    signatureTraits: [
      'Site-responsive design',
      'Restrained material palette',
      'Generous living spaces',
      'Strong relationship to landscape',
      'Seasonal light considerations',
      'Practical, lived-in quality',
    ],
    preferredStyles: ['quebecois-contemporary', 'rustic-modern', 'nordic'],
    materialPreferences: ['wood', 'stone', 'brick', 'glass'],
    notableProjects: ['Residence Alain Carle', 'Maison du Prefet'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['alain-carle'],
  },
  {
    id: 'santiago-calatrava',
    name: 'Santiago Calatrava',
    tagline: 'Architecture as structural sculpture — white bones and moving wings',
    philosophy: `I believe every building should be a kinetic sculpture. My designs are born from the movement of nature — the wing of a bird, the skeleton of a leaf, the spine of a human. White is my colour — pure, luminous, timeless. I believe in structure as ornament, in engineering elevated to poetry, in buildings that move and breathe.`,
    signatureTraits: [
      'White skeletal structures',
      'Organic, nature-inspired forms',
      'Kinetic architectural elements',
      'Aerial, weightless appearance',
      'Repetitive structural ribs',
      'Bridge-like spanning elements',
    ],
    preferredStyles: ['structural-expressionist', 'neo-futuristic', 'monumental'],
    materialPreferences: ['white steel', 'concrete', 'glass', 'titanium'],
    notableProjects: ['City of Arts and Sciences Valencia', 'Turning Torso', 'World Trade Center Transportation Hub'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['santiago-calatrava'],
  },
  {
    id: 'louis-kahn',
    name: 'Louis Kahn',
    tagline: 'The spatial poetry of light, brick, and the room',
    philosophy: `I believe in the room. Not the floor plan — the room. The room is where life happens: the kitchen that smells of bread, the studio filled with north light, the library that whispers. I use brick as a noble material, and I let concrete age honestly. I believe in silence and light — the window is the place where the outside and inside meet.`,
    signatureTraits: [
      'Monumental brick forms',
      'Dramatic use of natural light',
      'Central gathering spaces',
      'The room as the unit of design',
      'Exposed service cores',
      'Long circulation corridors',
    ],
    preferredStyles: ['monumental-modernist', 'brutalist', 'institutional'],
    materialPreferences: ['brick', 'concrete', 'wood', 'travertine'],
    notableProjects: ['Salk Institute', 'Kimbell Art Museum', 'National Assembly Bangladesh'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['louis-kahn'],
  },
  {
    id: 'rem-koolhaas',
    name: 'Rem Koolhaas',
    tagline: 'Bigness and the city — architecture of the metropolitan condition',
    philosophy: `I believe in Bigness — the scale at which architecture becomes urbanism. The city is my building. I celebrate congestion, density, the accidental richness of metropolitan life. I believe buildings should be complex and ambiguous — adaptable to uses their designers never imagined. I design for the unknown future.`,
    signatureTraits: [
      'Large-scale urban buildings',
      'Deep plans with interior streets',
      'Programmatic complexity',
      'Raw material palette',
      'CCTV-style stacked volumes',
      'Critical attitude to convention',
    ],
    preferredStyles: ['ultra-modern', 'critical-practice', 'urban'],
    materialPreferences: ['concrete', 'steel', 'glass', 'cor-ten'],
    notableProjects: ['CCTV Headquarters Beijing', 'Seattle Central Library', 'Casa da Música'],
    tokenMultiplier: ARCHITECT_TOKEN_MULTIPLIERS['rem-koolhaas'],
  },
];

/** Lookup architect by ID. Returns undefined if not found. */
export function getArchitectById(id: string): ArchitectProfile | undefined {
  return ARCHITECT_PROFILES.find(a => a.id === id);
}

/** Build a prompt section that injects architect influence into the system prompt. */
export function buildArchitectPromptSection(architect: ArchitectProfile): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECT INFLUENCE: ${architect.name.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHILOSOPHY:
${architect.philosophy}

SIGNATURE DESIGN TRAITS:
${architect.signatureTraits.map(t => `• ${t}`).join('\n')}

PREFERRED STYLES: ${architect.preferredStyles.join(', ')}

MATERIAL PREFERENCES: ${architect.materialPreferences.join(', ')}

NOTABLE WORKS: ${architect.notableProjects.join(', ')}

When generating this design, apply ${architect.name}'s philosophy and signature traits. Let their way of thinking shape the spatial relationships, material choices, and overall character of the building.`;
}
