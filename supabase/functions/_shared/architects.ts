// Types
export interface ArchitectRule {
  rule: string;
  why: string;
  applyWhen: string;
}

export interface BlendPair {
  withId: string;
  guidance: string;
  warning: string;
}

export interface ArchitectProfile {
  id: string;
  name: string;
  era: string;
  tagline: string;
  philosophySummary: string;
  spatialSignature: string;
  siteApproach: string;
  materialPalette: string[];
  structuralPhilosophy: string;
  lightApproach: string;
  idealClient: string;
  appliedRules: ArchitectRule[];
  strengths: string;
  potentialWeaknesses: string;
  blendGuidance: BlendPair[];
  complexityTier: 'core' | 'advanced' | 'premium';
}

// Constants — all 12 profiles

export const WRIGHT: ArchitectProfile = {
  id: 'frank-lloyd-wright',
  name: 'Frank Lloyd Wright',
  era: 'Organic Architecture, 1890s–1959',
  tagline: 'Architecture that grows from the land like a tree',
  philosophySummary:
    'Wright believed architecture should emerge organically from the land, not be imposed upon it. His buildings feature horizontal lines that echo the landscape, open plans that free rooms from rigid walls, and a deep integration of interior and exterior through careful use of light, materials, and natural ventilation. Every element serves both beauty and function.',
  spatialSignature:
    'Rooms that flow into each other without sharp boundaries. Low ceilings that expand upward. Built-in furnishings that make architecture and furniture inseparable. Fireplace as gravitational centre.',
  siteApproach:
    'Buildings sit low on the land, hugging contours. Garden walls become room walls — the boundary between inside and outside dissolves. Windows open the building to specific views while deep overhangs provide shade and privacy.',
  materialPalette: ['Prairie brick', 'Colorado copper', 'Oak timber', 'Sandstone', 'Float glass'],
  structuralPhilosophy:
    'Cantilevered horizontal planes supported by brick piers and steel. Thick walls with concealed structure. Open plan achieved through the absence of load-bearing walls.',
  lightApproach:
    'Horizontal ribbon windows below the ceiling line create continuous bands of light. Clerestory windows bring light into the centre of rooms. Light changes throughout the day, animating the space.',
  idealClient:
    'Homeowners with large, sloping sites who value craftsman-quality construction and a deep connection between architecture and landscape.',
  appliedRules: [
    {
      rule: 'Fireplace at geometric centre — all rooms orient to it',
      why: 'Creates gravitational pull that makes navigation intuitive and gatherings natural',
      applyWhen: 'Always in residential, especially on sloping sites',
    },
    {
      rule: 'Horizontal ribbon windows below ceiling line — continuous light',
      why: 'Creates connection to landscape while maintaining privacy with deep overhangs',
      applyWhen: 'All elevations facing garden or natural views',
    },
    {
      rule: 'Deep overhangs (1.2m minimum) — shade + invitation',
      why: 'Provides shade in summer, allows winter sun in, creates covered outdoor space',
      applyWhen: 'All climates, mandatory in hot-summer climates',
    },
    {
      rule: 'No corridor bedrooms — rooms open directly to living areas',
      why: 'Corridors waste space and break the spatial flow Wright prized',
      applyWhen: 'Residential only, all sizes',
    },
    {
      rule: 'Built-in furniture as architecture — benches, shelves, desks',
      why: 'Eliminates furniture as separate objects; makes the room',
      applyWhen: 'All residential',
    },
    {
      rule: 'Garden wall becomes room wall — boundary dissolves',
      why: 'Extends living space visually and functionally into the landscape',
      applyWhen: 'Properties with good garden or natural setting',
    },
  ],
  strengths:
    'Extraordinary integration with landscape, craftsmanship quality, spatial richness within modest budgets, enduring relevance of organic principles.',
  potentialWeaknesses:
    'Construction quality critical — poor execution undermines everything. Thick walls reduce floor area. Not suited to urban infill or tight suburban lots.',
  blendGuidance: [
    {
      withId: 'scandinavian',
      guidance: "Wright's horizontality + Scandinavian warmth and hygge",
      warning: "Avoid: Wright's thick walls conflict with MCM steel-and-glass openness",
    },
    {
      withId: 'mid-century-modern',
      guidance: "Shared open plan DNA, Wright's craft + MCM industrial materials",
      warning: "Avoid: MCM rooflines can conflict with Wright's deep overhangs",
    },
  ],
  complexityTier: 'core',
};

export const HADID: ArchitectProfile = {
  id: 'zaha-hadid',
  name: 'Zaha Hadid',
  era: 'Parametric Neo-futurism, 1980s–2016',
  tagline: 'Form follows the future',
  philosophySummary:
    "Hadid's architecture rejected the box — she used computational design to create fluid, dynamic forms that suggested movement even in stillness. Her buildings were about speed, change, and the future. She believed the architect's job was to imagine what hadn't existed before and make it real through technology.",
  spatialSignature:
    'Spaces that feel in motion — curved walls, inclined floors, double-height voids that cascade through the building. No orthogonal corners unless they serve a structural purpose. Interior and exterior blur through continuous surfaces.',
  siteApproach:
    'Buildings as event — form responds to sight lines, prevailing winds, solar access through the lens of pure formal invention. Site constraints are opportunities for formal acrobatics, not constraints.',
  materialPalette: ['GFRC (glass fibre reinforced concrete)', 'Polished steel', 'Engineered timber', 'HDPE', 'Laminated glass'],
  structuralPhilosophy:
    'Concrete shell structures and steel diagrids handle complex curved geometries. Structure is expressed, not hidden. Every surface is a structural member.',
  lightApproach:
    'Floor-to-ceiling glazing on all elevations — the building is a transparent shell. Light enters from all directions, no dark corners. Interior lighting designed to emphasise the curves at night.',
  idealClient:
    'Cultural institutions, luxury hotels, and developers wanting iconic statement buildings that become destinations in themselves.',
  appliedRules: [
    {
      rule: 'Fluid spatial transitions — no 90° corners unless load-bearing',
      why: 'Angles and curves create sense of movement and discovery',
      applyWhen: 'Always',
    },
    {
      rule: 'Floor-to-ceiling glazing on all elevations',
      why: 'Maximises transparency and connection to surroundings',
      applyWhen: 'All elevations, all projects',
    },
    {
      rule: 'Cantilevered volumes create covered outdoor space below',
      why: 'Creates dramatic covered public space while maximising site coverage',
      applyWhen: 'Urban sites, all scales',
    },
    {
      rule: 'Stair as sculptural centrepiece, not utility',
      why: "The stair is the building's spine and showpiece",
      applyWhen: 'Always, all projects',
    },
    {
      rule: 'Seamless indoor-outdoor through form',
      why: 'Building form creates continuous flow between inside and outside',
      applyWhen: 'All climates',
    },
    {
      rule: 'Roof as fifth facade — visible from above',
      why: 'Modern cities are experienced from above as much as street level',
      applyWhen: 'Highrise or adjacent tall buildings',
    },
  ],
  strengths:
    'Iconic, photogenic architecture that transforms its context. Unmatched formal invention. Creates spaces that feel like the future.',
  potentialWeaknesses:
    'Extremely expensive to build and detail. Complex maintenance. Not suited to modest budgets or conservative clients.',
  blendGuidance: [
    {
      withId: 'high-tech',
      guidance: "Hadid's forms + High-Tech's exposed services create maximum visual drama",
      warning: "Avoid: High-Tech's industrial aesthetic can undermine Hadid's fluidity",
    },
  ],
  complexityTier: 'advanced',
};

export const ANDO: ArchitectProfile = {
  id: 'tadao-ando',
  name: 'Tadao Ando',
  era: 'Zen Minimalism, 1980s–present',
  tagline: 'Silence and light',
  philosophySummary:
    "Ando's architecture is about subtraction — removing everything unnecessary until only the essential remains. He works primarily in exposed concrete, using the interplay of natural light with thick, precise walls to create spaces of profound stillness. His buildings are meditative instruments calibrated to the movement of the sun.",
  spatialSignature:
    'Spare, geometric spaces of absolute precision. Thick concrete walls with tiny apertures that direct shafts of light into otherwise dark rooms. Water and light as the only decoration. Silence is palpable.',
  siteApproach:
    'Buildings turn inward, away from the street, creating hidden courtyards and gardens. The site is treated as a world within — a self-contained universe of light and shadow. Approaches are designed to slow visitors down before entry.',
  materialPalette: ['Board-formed exposed concrete', 'Structural steel', 'Clear glass', 'Water', 'Untreated cedar'],
  structuralPhilosophy:
    'Concrete walls are both structure and finish — no cladding, no concealment. Thick walls (200–300mm) provide thermal mass and create the sense of permanence and weight that defines the spaces.',
  lightApproach:
    'Light enters through narrow slots, courtyards, and skylights as a designed element. Apertures are calibrated to create specific patterns of light and shadow at specific times of day. Interior spaces are often dark, relying on single dramatic light sources.',
  idealClient:
    'Private homeowners who value contemplation, art collectors, and cultural institutions seeking spaces for reflection and display.',
  appliedRules: [
    {
      rule: 'Exposed concrete as primary material — board-formed, no decoration',
      why: "Concrete's honesty and ability to record time through weathering embodies the philosophy",
      applyWhen: 'All projects, primary material',
    },
    {
      rule: 'Apertures as controlled light instruments — narrow slots, courtyards',
      why: 'Every light opening is designed to create specific spatial experiences, not just daylighting',
      applyWhen: 'All projects',
    },
    {
      rule: 'Silence as design element — remove everything unnecessary',
      why: 'Reduction creates the contemplative atmosphere that defines the work',
      applyWhen: 'Always',
    },
    {
      rule: 'Water and light as the only ornament',
      why: 'These natural elements bring life and change without adding objects',
      applyWhen: 'Courtyards and key transitional spaces',
    },
    {
      rule: 'Thick walls (200–300mm) with thermal mass',
      why: 'Creates the sense of weight and permanence and moderates temperature without technology',
      applyWhen: 'All projects',
    },
    {
      rule: 'Transition spaces that slow you down',
      why: 'Antechambers, courtyards, and compressed passages prepare visitors for the main space',
      applyWhen: 'All projects',
    },
  ],
  strengths:
    'Extraordinary light effects, profound stillness, buildings that age beautifully in concrete. Construction quality is paramount but achievable.',
  potentialWeaknesses:
    'Extremely demanding construction tolerance. Cold material without warm furnishings. Not suited to clients who want warmth or decoration.',
  blendGuidance: [
    {
      withId: 'japandi',
      guidance: "Ando's concrete + Japandi warmth through natural materials and considered craft",
      warning: "Avoid: Japandi's softness can undermine Ando's severity",
    },
  ],
  complexityTier: 'core',
};

export const FOSTER: ArchitectProfile = {
  id: 'norman-foster',
  name: 'Norman Foster',
  era: 'High-Tech / Transparent, 1960s–present',
  tagline: 'Architecture through transparency',
  philosophySummary:
    "Foster's architecture celebrates technology as a means to create humane, energy-efficient buildings. His high-tech approach uses exposed structural and mechanical systems as aesthetic elements while pursuing environmental performance through intelligent design rather than added technology.",
  spatialSignature:
    'Bright, transparent spaces with visible structure. Open plans where the building\'s bones — ducts, beams, columns — become spatial elements. High ceilings in living areas, lower ceilings in service zones creating clear spatial hierarchy.',
  siteApproach:
    'Buildings designed to respond actively to their orientation — facades shade themselves, solar collectors track the sun, wind drives natural ventilation. Site is a resource for environmental performance.',
  materialPalette: ['Structural steel', 'Low-iron glass', 'Aluminium', 'Timber', 'ETFE'],
  structuralPhilosophy:
    'Steel frames with expressed connections and exposed services. Long-span structures that create column-free interiors. Structure and services are always visible and designed as part of the architecture.',
  lightApproach:
    'Facades respond to orientation — highly glazed north elevations, shaded south elevations. Roof lights with diffuse glazing. Electric lighting integrated into the ceiling plane as architecture.',
  idealClient:
    'Commercial developers, tech companies, and institutions wanting highly functional, energy-efficient, and transparent buildings.',
  appliedRules: [
    {
      rule: 'Steel and glass as elegance, not coldness',
      why: 'Exposed structure and high-quality glazing create precision and warmth',
      applyWhen: 'All projects',
    },
    {
      rule: 'Facades that respond to orientation — active facade systems',
      why: 'Optimises solar gain and daylight without sacrificing transparency',
      applyWhen: 'All buildings with significant solar exposure',
    },
    {
      rule: 'Open plan with visible structure — mechanical aesthetic',
      why: 'Structure and services become the architecture, not something to hide',
      applyWhen: 'Always',
    },
    {
      rule: 'High ceilings in living areas, service zone below',
      why: 'Clear hierarchy separates human space from technical space',
      applyWhen: 'All residential',
    },
    {
      rule: 'Roof as solar collector + daylight reflector',
      why: 'Maximises environmental performance and daylight penetration',
      applyWhen: 'All buildings with flat roofs',
    },
    {
      rule: 'Smart home integration as standard, not luxury',
      why: 'Technology should serve comfort and efficiency transparently',
      applyWhen: 'All residential',
    },
  ],
  strengths:
    'Outstanding environmental performance, highly functional, bright and healthy spaces. Prefabrication reduces construction time and cost.',
  potentialWeaknesses:
    'High-tech systems require ongoing maintenance. Not suited to traditional or craft-based aesthetics. Initial cost can be higher than conventional construction.',
  blendGuidance: [
    {
      withId: 'modernist',
      guidance: "Foster's high-tech refinement + Le Corbusier's machine-age optimism",
      warning: "Avoid: Corbusier's thick walls conflict with Foster's transparent skins",
    },
  ],
  complexityTier: 'advanced',
};

export const CORBUSIER: ArchitectProfile = {
  id: 'le-corbusier',
  name: 'Le Corbusier',
  era: 'Modernism / Corbusian Machine, 1920s–1965',
  tagline: 'A machine for living in',
  philosophySummary:
    "Le Corbusier's Five Points of Architecture — pilotis, free plan, free facade, ribbon windows, roof garden — created a new grammar for modern living. He believed houses should be 'machines for living in' — efficient, rational, beautiful instruments. His work evolved from white geometric purism to raw concrete brutalism.",
  spatialSignature:
    'Geometric precision, free plans with minimal structural interruption. Ribbon windows create horizontal bands of light. Pilotis lift the building, freeing the ground floor. Roof gardens replace the land the building occupies.',
  siteApproach:
    'Buildings placed on pilotis regardless of site — the building is an abstract geometric object inserted into any context. The free facade allows window placement based on interior needs rather than structural logic.',
  materialPalette: ['White stucco', 'Raw concrete', 'Steel', 'Glass', 'Stone'],
  structuralPhilosophy:
    'Reinforced concrete frame with flat slab. Load-bearing elements reduced to columns. Walls are non-structural — the building is a frame with a free skin.',
  lightApproach:
    'Horizontal strip windows provide even, diffuse light across all elevations. Light is considered a utility — calculated for maximum benefit regardless of orientation.',
  idealClient:
    'Modern-minded families with clear ideas about how they want to live. Artists, intellectuals, and progressive institutions.',
  appliedRules: [
    {
      rule: 'Free plan — columns, not load-bearing walls',
      why: 'Maximises interior flexibility and spatial freedom',
      applyWhen: 'Always',
    },
    {
      rule: 'Facade as free composition — window placement over aesthetics',
      why: "Each window positioned for the room's specific needs",
      applyWhen: 'Always',
    },
    {
      rule: 'Pilotis — ground floor freed, building floats',
      why: 'Returns ground to pedestrian, creates covered outdoor space below',
      applyWhen: 'All buildings on ground plane',
    },
    {
      rule: 'Roof garden as standard — green replaces what building occupies',
      why: 'Compensates for the land the building takes',
      applyWhen: 'All flat-roof buildings',
    },
    {
      rule: 'Horizontal strip windows — ribbon of light',
      why: 'Even illumination without glare, connects all spaces visually',
      applyWhen: 'All elevations',
    },
    {
      rule: 'Machine for living in — every room has a defined purpose',
      why: 'Rational organisation of domestic life into efficient, beautiful spaces',
      applyWhen: 'All residential',
    },
  ],
  strengths:
    'Spatial flexibility, rational organisation, timeless geometric beauty. Construction is relatively straightforward once the system is established.',
  potentialWeaknesses:
    'Can feel cold and impersonal without careful furnishing. Ribbon windows can cause solar overheating. Not suited to complex programmes or sloping sites.',
  blendGuidance: [
    {
      withId: 'modernist',
      guidance: "Corbusier's geometric rigour + High-Tech transparency",
      warning: "Avoid: High-Tech's expressed services can undermine Corbusier's purist surfaces",
    },
  ],
  complexityTier: 'core',
};

export const ZUMTHOR: ArchitectProfile = {
  id: 'peter-zumthor',
  name: 'Peter Zumthor',
  era: 'Phenomenological / Atmospheric, 1990s–present',
  tagline: 'Architecture of atmosphere',
  philosophySummary:
    'Zumthor creates buildings that engage all the senses — the smell of timber, the sound of rain on a roof, the feel of weathered metal. His architecture is about the emotional and physical experience of space rather than visual form. He builds slowly, obsessively, with deep attention to materials and their ageing.',
  spatialSignature:
    'Spaces that feel enclosed and protective. Thick walls, low ceilings in transitional spaces, soaring voids in key rooms. Light is always present but controlled — entering as a material element through carefully positioned apertures.',
  siteApproach:
    'Buildings emerge from their sites through an attentiveness to what\'s already there — topography, vegetation, existing structures, memory. New buildings extend what exists rather than imposing on it. Site is treated as memory, not blank slate.',
  materialPalette: ['Weathered timber', 'Cor-ten steel', 'Natural stone', 'Copper', 'Wool', 'Linen'],
  structuralPhilosophy:
    'Heavy timber or concrete structure with materials chosen for how they age and weather. Structure is expressed honestly — no veneers, no pretension. Joinery details are crafted with the precision of cabinetmaking.',
  lightApproach:
    'Natural light is the primary design tool. Windows are positioned to create specific effects — shafts of light across a stone wall, reflections on water, pools of light on dark floors. Electric light is warm and minimal.',
  idealClient:
    'Cultural institutions, spa and hospitality clients, and private homeowners who value craft, slowness, and sensory richness.',
  appliedRules: [
    {
      rule: 'Material honesty — no veneers, no pretension',
      why: 'Authentic materials that age honestly create buildings with integrity',
      applyWhen: 'Always',
    },
    {
      rule: 'Layered atmospheres — between inside and outside',
      why: 'Courtyards, loggias, and thresholds create gradual transition between worlds',
      applyWhen: 'All projects',
    },
    {
      rule: 'Thermal comfort through mass, not technology',
      why: 'Heavy materials moderate temperature naturally, reducing reliance on mechanical systems',
      applyWhen: 'All climates',
    },
    {
      rule: 'Silence and slowness built into the spatial sequence',
      why: 'Compressed passages and low thresholds slow visitors down before releasing them into main spaces',
      applyWhen: 'All projects',
    },
    {
      rule: 'Light as material — natural light as the primary design tool',
      why: 'Light is the element that animates architecture and creates emotional response',
      applyWhen: 'All projects',
    },
    {
      rule: "Site as memory — building connects to what's there",
      why: 'New buildings should extend and honour the history of their place',
      applyWhen: 'All sites, especially those with existing structures',
    },
  ],
  strengths:
    'Unparalleled sensory richness, buildings that age beautifully, extraordinary attention to craft and detail. No two Zumthor buildings are alike because each responds completely to its site.',
  potentialWeaknesses:
    'Extremely demanding construction quality. Slow, expensive process. Not suited to tight budgets or fast timelines.',
  blendGuidance: [
    {
      withId: 'organic',
      guidance: "Zumthor's material honesty + Wright's integration with landscape",
      warning: "Avoid: Wright's horizontality conflicts with Zumthor's compact, vertical emphasis",
    },
  ],
  complexityTier: 'advanced',
};

export const INGELS: ArchitectProfile = {
  id: 'bjarke-ingels',
  name: 'Bjarke Ingels',
  era: 'Hedonistic Sustainability, 2000s–present',
  tagline: 'Sustainability as joy',
  philosophySummary:
    'Ingels challenges the notion that sustainable architecture must be austere or sacrifice pleasure. His BIG projects are bold, playful, and often literally green — ski slopes on rooftops, urban farms, and public parks that reward users with joy while meeting ambitious environmental targets.',
  spatialSignature:
    'Large-scale, bold geometric forms that are immediately legible. Buildings that reward you for exploring — every rooftop is usable, every edge is a public space. Scale is always social.',
  siteApproach:
    'Buildings occupy their sites generously, returning public space wherever possible. Rooftops are always considered as potential public amenities. Massing responds to urban context while maximising the experience for occupants.',
  materialPalette: ['Green roof systems', 'Cross-laminated timber', 'Polished concrete', 'Glass', 'Solar panels as facade'],
  structuralPhilosophy:
    'Hybrid timber-concrete structures that balance carbon with performance. Parametric design tools allow optimisation of both form and structure simultaneously.',
  lightApproach:
    'Maximised natural daylight through generous glazing and well-designed floor plans. All residential units get dual-aspect exposure. Urban rooftop amenities designed to benefit from sun access.',
  idealClient:
    'Municipalities, developers, and cultural institutions wanting sustainable buildings that are also beloved destinations.',
  appliedRules: [
    {
      rule: 'Sustainability as joy — green roofs you want to use, not just look at',
      why: 'When sustainability is pleasurable, people engage with it',
      applyWhen: 'Always in residential and public buildings',
    },
    {
      rule: 'Hybrid programmes — ski slope as roof, farm as amenity',
      why: 'Maximising the value of every surface creates sustainable urbanism that works',
      applyWhen: 'Large-scale projects with diverse programmes',
    },
    {
      rule: 'Bold moves — BIG buildings are never boring',
      why: 'Architecture should delight and surprise, not just function',
      applyWhen: 'Always',
    },
    {
      rule: 'Pragmatic sustainability — technology in service of experience',
      why: 'Technology is the enabler, not the message',
      applyWhen: 'All projects',
    },
    {
      rule: 'Social spaces at every scale',
      why: "Architecture's social purpose is as important as its environmental credentials",
      applyWhen: 'All projects',
    },
    {
      rule: 'Parametric but human — geometry with warmth',
      why: 'Complex forms should feel inevitable, not arbitrary',
      applyWhen: 'All parametric projects',
    },
  ],
  strengths:
    'Bold, photogenic, popular sustainability. Urban-scale thinking. Ability to deliver complex programmes on time and budget.',
  potentialWeaknesses:
    'Bold formal moves can overshadow the mundane realities of building performance. Complex roof programmes require ongoing maintenance.',
  blendGuidance: [
    {
      withId: 'parametric',
      guidance: "Ingels' pragmatism tempers Hadid's formal invention with real-world deliverability",
      warning: "Avoid: Too much formal play can undermine the sustainability message",
    },
  ],
  complexityTier: 'advanced',
};

export const KUMA: ArchitectProfile = {
  id: 'kengo-kuma',
  name: 'Kengo Kuma',
  era: 'Japanese Soft Modernism, 1990s–present',
  tagline: 'Architecture that disappears',
  philosophySummary:
    "Kuma's architecture refuses to assert itself. Instead of grand gestures, he creates layered, textured environments where inside and outside blur, natural materials age gracefully, and the building becomes part of a landscape rather than dominating it. He calls this 'anti-object' architecture.",
  spatialSignature:
    'Spaces divided by screens and layers rather than solid walls. Inside feels like outside because materials — wood, stone, paper — are continuous from interior to exterior. Scale is domestic and tactile rather than monumental.',
  siteApproach:
    'Buildings read the land and extend its logic rather than imposing a new order. Materials are sourced from the region. New buildings often replace or extend existing structures, never competing with their context.',
  materialPalette: ['Hinoki cypress', 'Shou sugi ban (charred timber)', 'Andesite stone', 'Washi (Japanese paper)', 'Aluminium mesh'],
  structuralPhilosophy:
    'Light timber or steel frames with non-structural screens and layers. Structure is hidden within the layered facade system. Joinery details are refined to the millimeter.',
  lightApproach:
    'Light is filtered through screens, meshes, and paper panels creating soft, diffused illumination. No harsh direct light. Interior lighting designed to enhance the material qualities of wood and stone.',
  idealClient:
    'Luxury hospitality, private residences, and cultural institutions in natural settings. Particularly suited to Japan, but applicable wherever sensitivity to context is valued.',
  appliedRules: [
    {
      rule: 'Materials that age beautifully — wood, stone, paper',
      why: 'Materials that improve with weathering create buildings that are alive',
      applyWhen: 'Always',
    },
    {
      rule: "Disappearing architecture — building that doesn't assert itself",
      why: "When architecture disappears into its environment, it creates deeper spatial experiences",
      applyWhen: 'All natural and residential contexts',
    },
    {
      rule: 'Interior landscape — inside feels like outside',
      why: 'Layered screens and continuous materials blur the boundary',
      applyWhen: 'All projects',
    },
    {
      rule: 'Screens and layers — space divided by transparent elements',
      why: 'Creates spatial complexity without solid walls',
      applyWhen: 'Always',
    },
    {
      rule: 'Craft and precision — joint details matter',
      why: 'In visible-structure architecture, every joint is exposed and must be beautiful',
      applyWhen: 'All projects',
    },
    {
      rule: 'Silence in the plan — no wasted circulation',
      why: 'Every square meter is considered; no dead space or corridors',
      applyWhen: 'All projects',
    },
  ],
  strengths:
    'Extraordinary material craftsmanship, deeply contextual, spaces of exceptional calm and beauty. Materials that age and improve over time.',
  potentialWeaknesses:
    'Extremely demanding craft quality. Not suited to urban intensity or bold architectural statements. Ongoing maintenance required for natural materials.',
  blendGuidance: [
    {
      withId: 'zen-minimalist',
      guidance: "Kuma's warmth and craft + Ando's severity creates depth and richness",
      warning: 'Avoid: Combining too many minimal approaches can create coldness',
    },
    {
      withId: 'scandinavian',
      guidance: 'Shared love of natural materials and craft creates natural alliance',
      warning: "Avoid: Scandinavian maximalism can compete with Kuma's subtractive approach",
    },
  ],
  complexityTier: 'advanced',
};

export const CALATRAVA: ArchitectProfile = {
  id: 'santiago-calatrava',
  name: 'Santiago Calatrava',
  era: 'Structural Expressionism, 1980s–present',
  tagline: 'Structure as sculpture',
  philosophySummary:
    'Calatrava treats every building as a sculpture that moves. His architecture makes structural engineering visible — tension cables, pivoting canopies, folding facades are the architecture. He is obsessed with the beauty of the human body in motion and brings that dynamism to everything he designs.',
  spatialSignature:
    "White-dominant buildings with structural forms that read as sculpture. Spaces are often secondary to the structural drama — the interior is the armature for the exterior spectacle. No room is as impressive as the building's silhouette.",
  siteApproach:
    'Form follows the unique topography and structural logic simultaneously. Buildings are designed to be seen from all angles and at all scales — from the pedestrian to the aerial.',
  materialPalette: ['White concrete', 'Structural steel', 'Cable stays', 'Laminated glass', 'Stone'],
  structuralPhilosophy:
    'Structure IS the architecture — every beam, column, and cable is designed as a visual element. Concrete and steel are sculptural mediums. Movement — pivoting, folding, opening — is built into many designs.',
  lightApproach:
    'Light is sculptural — structures cast dramatic shadows that animate the white surfaces. Skylights and clerestories bring light into the deepest interior spaces. Night lighting makes the building a lantern.',
  idealClient:
    'Transit authorities, museums, and municipalities wanting iconic structures that become destinations and landmarks.',
  appliedRules: [
    {
      rule: 'Structure IS the architecture — no cover-ups',
      why: 'The direct connection between engineering and art that defines the work',
      applyWhen: 'Always',
    },
    {
      rule: 'White as dominant colour — makes structural forms read',
      why: 'White makes the shadows and forms visible and legible',
      applyWhen: 'Always',
    },
    {
      rule: 'Movement as design — pivoting, folding, opening',
      why: 'Movement brings buildings to life and creates wonder',
      applyWhen: 'Where programme allows',
    },
    {
      rule: 'Site-responsive geometry — form follows the unique topography',
      why: "Each site's specific conditions inspire the formal logic",
      applyWhen: 'All sites',
    },
    {
      rule: 'Bridge logic — tension and compression made visible',
      why: 'The drama of structural forces is the architecture',
      applyWhen: 'All projects',
    },
    {
      rule: 'Light as sculptural element — structures cast dramatic shadows',
      why: 'Shadows give depth and animation to the white surfaces',
      applyWhen: 'All projects',
    },
  ],
  strengths:
    'Unmistakable iconic architecture. Extraordinary structural innovation. Buildings that create wonder and become beloved landmarks.',
  potentialWeaknesses:
    'Extremely expensive to build. Frequent delays and cost overruns. White surfaces show weathering. Maintenance is constant and costly.',
  blendGuidance: [
    {
      withId: 'parametric',
      guidance: "Calatrava's sculptural structure + Hadid's fluid forms create maximum drama",
      warning: 'Avoid: Both approaches are visually dominant — one should recede',
    },
  ],
  complexityTier: 'premium',
};

export const CARLE: ArchitectProfile = {
  id: 'alain-carle',
  name: 'Alain Carle',
  era: 'Quebecois Contextual, 1990s–present',
  tagline: 'Architecture rooted in winter light',
  philosophySummary:
    "Carle's architecture responds to the specific challenges of Quebec's extreme climate — bitter winters, dramatic light shifts from deep freeze to brilliant summer, and a desire to be connected to nature even while sheltering from it. His regional modernism uses local wood and stone to create buildings that are simultaneously modern and deeply rooted.",
  spatialSignature:
    'Compact, efficient plans that manage heat loss while maximising solar gain. Generous covered terraces and transitional spaces that extend living into the shoulder seasons. Inside, spaces are warm and timber-lined, contrasting with the severe exterior.',
  siteApproach:
    'Buildings orient to the sun, not the road. South-facing glazed volumes capture winter sun while north-facing service zones protect against cold. Sloping sites are used to create walkout basements and reduce the building\'s apparent scale.',
  materialPalette: ['Eastern white pine', 'Structural timber', 'Rubber membrane', 'Steel', 'Local stone'],
  structuralPhilosophy:
    'Timber frame with engineered wood products. Compact building envelope minimises heat loss. Deep overhangs shade summer sun while admitting winter sun.',
  lightApproach:
    "Designed for Quebec's extreme light variation — generous south glazing for winter solar gain, deep shading for summer. North-facing clerestories provide even, cool light for workspaces.",
  idealClient:
    'Quebecois homeowners who want a modern house that is rooted in the landscape and responds to the climate without retreating from it.',
  appliedRules: [
    {
      rule: "Response to Quebecois climate — cold, snow, light",
      why: 'Extreme climate demands specific responses; imported vocabularies do not work',
      applyWhen: 'All projects in cold climates',
    },
    {
      rule: 'Regional modernism — not imported vocabulary',
      why: 'Architecture should respond to its place and culture',
      applyWhen: 'All projects',
    },
    {
      rule: 'Wood and stone as primary materials',
      why: 'Local materials connect to place and age gracefully in the climate',
      applyWhen: 'Always',
    },
    {
      rule: 'Compact forms for energy efficiency',
      why: 'Minimal surface area reduces heat loss; every square metre is valuable',
      applyWhen: 'All residential',
    },
    {
      rule: 'Covered transition spaces — not just inside/outside',
      why: 'Verandas and covered terraces extend the season and connect to the landscape in comfort',
      applyWhen: 'All residential',
    },
    {
      rule: 'Scale relative to surroundings — neighbourhood matters',
      why: 'Buildings should fit their context, not assert themselves',
      applyWhen: 'All residential contexts',
    },
  ],
  strengths:
    'Deeply climate-responsive, regionally rooted, timber craft quality. Buildings that feel right in their landscape and age beautifully.',
  potentialWeaknesses:
    'Regional specificity may limit applicability outside Quebec. Compact forms work best on larger rural/suburban lots.',
  blendGuidance: [
    {
      withId: 'organic',
      guidance: "Carle's climate pragmatism + Wright's site integration creates deeply responsive houses",
      warning: "Avoid: Wright's sprawling horizontality can conflict with Carle's compact massing",
    },
  ],
  complexityTier: 'advanced',
};

export const KAHN: ArchitectProfile = {
  id: 'louis-kahn',
  name: 'Louis Kahn',
  era: 'Monumental Rationalism, 1950s–1974',
  tagline: 'Light as revelation',
  philosophySummary:
    "Kahn believed architecture was about the 'ruins of the future' — monumental spaces built to last millennia. His buildings are composed of distinct volumes, each with its own quality of light and purpose. He thought about rooms as if they were people — each with a character and a need for the right kind of light to fulfill its purpose.",
  spatialSignature:
    'Monumental spaces with high ceilings and precise apertures. Rooms are distinct — the library is for reading, the kitchen for cooking, each space designed for its specific activity. Service spaces (stairs, ducts) are as carefully designed as principal rooms.',
  siteApproach:
    'Buildings placed to take maximum advantage of natural light. The relationship between built and unbuilt space is considered as carefully as the building itself. Public spaces are civic and monumental; private spaces are intimate and carefully scaled.',
  materialPalette: ['Brick', 'Exposed concrete', 'Travertine', 'Wood', 'Bronze'],
  structuralPhilosophy:
    'Concrete frames with brick or stone infill. Massive walls with precise cutouts. Service cores and stairwells are expressed as distinct volumes attached to or within the main structure.',
  lightApproach:
    'Each room has a specific relationship to light — the library has north light for even illumination, the studio has controlled south light. Light enters through precise apertures that create geometric patterns on the stone and concrete surfaces.',
  idealClient:
    'Institutions — universities, museums, religious buildings — and private clients who want spaces of enduring quality and civic presence.',
  appliedRules: [
    {
      rule: 'Presence of light — rooms are lit by what they are',
      why: "Each room's purpose determines its light; the library is bright, the chapel is dark",
      applyWhen: 'All projects',
    },
    {
      rule: 'Monumental materiality — brick, concrete, stone',
      why: 'Materials that last millennia create buildings that serve generations',
      applyWhen: 'All projects',
    },
    {
      rule: 'Servants and served — clear hierarchy in plans',
      why: 'Service spaces should be as beautifully designed as principal rooms but clearly differentiated',
      applyWhen: 'All projects',
    },
    {
      rule: 'Central gathering spaces — all rooms smaller, communal space larger',
      why: 'Buildings are for gathering; private rooms are for retreat',
      applyWhen: 'All residential and institutional',
    },
    {
      rule: 'Silence in the plan — each room has one clear purpose',
      why: 'Spaces designed for multiple purposes serve none well',
      applyWhen: 'Always',
    },
    {
      rule: 'Light as revelation — threshold between dark and light',
      why: 'The approach to a space — from dark to light — is as important as the space itself',
      applyWhen: 'All projects',
    },
  ],
  strengths:
    'Monumental spaces of extraordinary quality. Buildings that improve with age. Materials that develop patina and meaning over decades.',
  potentialWeaknesses:
    'Extremely demanding of construction quality. Not suited to modest budgets or fast timelines. Monumental spaces can feel intimidating in residential contexts.',
  blendGuidance: [
    {
      withId: 'rationalist',
      guidance: "Kahn's monumental materiality + Mies' precision creates spaces of maximum gravitas",
      warning: 'Avoid: Both approaches can produce coldness without careful material and light calibration',
    },
  ],
  complexityTier: 'advanced',
};

export const KOOLHAAS: ArchitectProfile = {
  id: 'rem-koolhaas',
  name: 'Rem Koolhaas',
  era: 'Urban Complexity / Bigness, 1970s–present',
  tagline: 'Bigness — when building becomes city',
  philosophySummary:
    "Koolhaas celebrates the complexity of the contemporary city. His 'Bigness' theory argues that when a building reaches sufficient scale, it becomes a city — with streets, districts, and diverse programmes all under one roof. He rejects architectural simplification in favour of the productive chaos of urban life.",
  spatialSignature:
    'Large-scale, complex buildings with multiple programmes coexisting. Interiors are designed as streets and squares rather than rooms. Density and complexity are assets, not problems to be solved. Movement systems — stairs, ramps, escalators — are the architecture.',
  siteApproach:
    'Buildings respond to the city rather than the site. The urban context — traffic, views, neighbouring buildings — is the brief. Buildings are designed as connectors that knit the city together.',
  materialPalette: ['Glass curtain wall', 'Steel frame', 'Concrete', 'Plastic', 'Whatever the programme demands'],
  structuralPhilosophy:
    'Steel or concrete frames of maximum flexibility. Structure is not the driver — programme and movement are. Floor plates are deep enough to accommodate any use.',
  lightApproach:
    'Deep floor plates are illuminated through skylights and light wells. Artificial light is designed as architecture — ceiling arrays, strip lighting. The building is a 24-hour environment.',
  idealClient:
    'Major cultural institutions, large commercial developers, and cities wanting buildings that accommodate the productive complexity of urban life.',
  appliedRules: [
    {
      rule: 'Bigness — when building becomes city',
      why: 'At sufficient scale, traditional architectural constraints break down',
      applyWhen: 'Large-scale projects only',
    },
    {
      rule: 'Programme as generator — what happens inside drives form',
      why: 'The complexity of contemporary life cannot be reduced to simple architectural gestures',
      applyWhen: 'All projects',
    },
    {
      rule: 'Urban adjacency — building as urban connector',
      why: 'Buildings should knit the city together, not isolate themselves',
      applyWhen: 'All urban projects',
    },
    {
      rule: 'Complexity over simplicity — richness over reduction',
      why: "The city's productive complexity is the model for architecture",
      applyWhen: 'All large-scale projects',
    },
    {
      rule: 'Infrastructure as architecture — ducts, stairs, elevators visible',
      why: "The building's mechanical systems are as interesting as its spaces",
      applyWhen: 'All projects',
    },
    {
      rule: 'Collage as method — not one idea but many coexisting',
      why: 'Architecture should accommodate multiple voices and uses without forced harmony',
      applyWhen: 'All projects',
    },
  ],
  strengths:
    'Unmatched ability to handle programme complexity. Urban-scale thinking. Intellectual rigour that produces architecture of genuine ideas.',
  potentialWeaknesses:
    'Dense, complex buildings require sophisticated management. Not suited to small sites or simple programmes. Can be intellectually cold.',
  blendGuidance: [
    {
      withId: 'high-tech',
      guidance: "Koolhaas' programme complexity + High-Tech's expressed services creates maximum density of information",
      warning: 'Avoid: Both approaches are visually busy — one element should dominate',
    },
  ],
  complexityTier: 'premium',
};

// Helpers

export const ALL_ARCHITECTS: ArchitectProfile[] = [
  WRIGHT,
  HADID,
  ANDO,
  FOSTER,
  CORBUSIER,
  ZUMTHOR,
  INGELS,
  KUMA,
  CALATRAVA,
  CARLE,
  KAHN,
  KOOLHAAS,
];

export function getArchitectById(id: string): ArchitectProfile | null {
  return ALL_ARCHITECTS.find((a) => a.id === id) ?? null;
}

export function getArchitectsForTier(
  tier: 'starter' | 'creator' | 'pro' | 'architect',
): ArchitectProfile[] {
  const TIER_ARCHITECTS: Record<string, string[]> = {
    starter: ['frank-lloyd-wright', 'zaha-hadid', 'tadao-ando'],
    creator: [
      'frank-lloyd-wright',
      'zaha-hadid',
      'tadao-ando',
      'norman-foster',
      'le-corbusier',
      'peter-zumthor',
      'bjarke-ingels',
    ],
    pro: [
      'frank-lloyd-wright',
      'zaha-hadid',
      'tadao-ando',
      'norman-foster',
      'le-corbusier',
      'peter-zumthor',
      'bjarke-ingels',
      'kengo-kuma',
      'alain-carle',
      'louis-kahn',
      'santiago-calatrava',
    ],
    architect: ALL_ARCHITECTS.map((a) => a.id),
  };
  return ALL_ARCHITECTS.filter((a) => TIER_ARCHITECTS[tier].includes(a.id));
}

export function calculateTokenCost(baseTokens: number, architectId: string): number {
  const MULTIPLIERS: Record<string, number> = {
    'frank-lloyd-wright': 1.0,
    'zaha-hadid': 1.5,
    'tadao-ando': 1.0,
    'norman-foster': 1.5,
    'le-corbusier': 1.0,
    'peter-zumthor': 1.5,
    'bjarke-ingels': 1.5,
    'kengo-kuma': 1.5,
    'alain-carle': 1.5,
    'louis-kahn': 1.5,
    'santiago-calatrava': 2.0,
    'rem-koolhaas': 2.0,
  };
  const multiplier = MULTIPLIERS[architectId] ?? 1.0;
  return Math.ceil(baseTokens * multiplier);
}

export function buildArchitectPromptSection(architect: ArchitectProfile): string {
  const rules = architect.appliedRules
    .map((r, i) => `${i + 1}. ${r.rule} → ${r.why}`)
    .join('\n');
  return `ARCHITECT INFLUENCE: ${architect.name}
═══════════════════════════════════
${architect.philosophySummary}

SPATIAL SIGNATURE: ${architect.spatialSignature}

APPLIED RULES (follow these exactly):
${rules}

SITE APPROACH: ${architect.siteApproach}
MATERIAL PALETTE: ${architect.materialPalette.join(', ')}
BLEND GUIDANCE: ${architect.blendGuidance.map((b) => `${b.withId}: ${b.guidance}`).join(' | ')}`;
}
