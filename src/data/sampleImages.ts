export interface SampleDocument {
  id: string;
  title: string;
  subject: string;
  type: 'Textbook Page' | 'Handwritten Notes' | 'Medical Diagram' | 'Formula Sheet';
  description: string;
  badge: string;
  svgDataUrl: string;
}

// Helper to generate a realistic SVG image encoded as Base64 Data URL
function createSvgDataUrl(content: string, width = 800, height = 1000): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="paper" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <pattern id="lines" width="100%" height="28" patternUnits="userSpaceOnUse">
        <line x1="0" y1="28" x2="800" y2="28" stroke="#e2e8f0" stroke-width="1"/>
      </pattern>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#f1f5f9" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#paper)"/>
    ${content}
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fullSvg)))}`;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'biology-cell-resp',
    title: 'Cellular Respiration & Krebs Cycle',
    subject: 'Cellular Biology',
    type: 'Textbook Page',
    badge: 'College Biology',
    description: 'Chapter 9: Glycolysis, Acetyl-CoA formation, Citric Acid Cycle, and Oxidative Phosphorylation yield.',
    svgDataUrl: createSvgDataUrl(`
      <rect x="0" y="0" width="800" height="70" fill="#0284c7" />
      <text x="40" y="44" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">CAMPBELL BIOLOGY · CHAPTER 9: CELLULAR RESPIRATION</text>
      
      <!-- Section 1 -->
      <text x="40" y="110" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">9.1 Overview of Aerobic Respiration</text>
      <text x="40" y="140" font-family="system-ui, sans-serif" font-size="14" fill="#334155">Cellular respiration is a metabolic pathway that breaks down glucose and produces ATP.</text>
      <text x="40" y="165" font-family="system-ui, sans-serif" font-size="14" fill="#334155">Overall balanced chemical equation:</text>
      <rect x="40" y="180" width="720" height="40" rx="6" fill="#f0f9ff" stroke="#bae6fd" />
      <text x="60" y="206" font-family="monospace" font-size="16" font-weight="bold" fill="#0369a1">C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + 30-32 ATP (ΔG = -686 kcal/mol)</text>

      <!-- Four Stages -->
      <text x="40" y="255" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">The Four Distinct Stages:</text>

      <rect x="40" y="275" width="720" height="110" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="302" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="#0284c7">1. Glycolysis (Cytosol):</text>
      <text x="60" y="325" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Occurs in the cytoplasm; does NOT require O2 (anaerobic).</text>
      <text x="60" y="345" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Splits 1 glucose (6C) into 2 molecules of pyruvate (3C).</text>
      <text x="60" y="365" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Net energy yield: 2 ATP (substrate-level phosphorylation) + 2 NADH.</text>

      <rect x="40" y="400" width="720" height="110" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="427" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="#0284c7">2. Pyruvate Oxidation (Mitochondrial Matrix):</text>
      <text x="60" y="450" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Pyruvate is actively transported into the mitochondrial matrix.</text>
      <text x="60" y="470" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Pyruvate dehydrogenase complex removes CO2, forms 1 NADH, and attaches Coenzyme A.</text>
      <text x="60" y="490" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Product per glucose: 2 Acetyl-CoA, 2 CO2, and 2 NADH.</text>

      <rect x="40" y="525" width="720" height="130" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="552" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="#0284c7">3. Citric Acid Cycle / Krebs Cycle (Mitochondrial Matrix):</text>
      <text x="60" y="575" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Acetyl-CoA (2C) combines with Oxaloacetate (4C) to form Citrate (6C).</text>
      <text x="60" y="595" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Completes two turns per glucose molecule.</text>
      <text x="60" y="615" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Yield per turn: 3 NADH, 1 FADH2, 1 GTP (ATP), and releases 2 CO2.</text>
      <text x="60" y="635" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Total yield per glucose: 6 NADH, 2 FADH2, 2 ATP, 4 CO2.</text>

      <rect x="40" y="670" width="720" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="697" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="#0284c7">4. Oxidative Phosphorylation & Chemiosmosis (Inner Mitochondrial Membrane):</text>
      <text x="60" y="720" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Electron Transport Chain (Complexes I, II, III, IV) pumps protons (H+) into the intermembrane space.</text>
      <text x="60" y="740" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Establishes a proton-motive force (electrochemical gradient).</text>
      <text x="60" y="760" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• O2 acts as the terminal electron acceptor, forming H2O.</text>
      <text x="60" y="780" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• ATP Synthase harnesses H+ flux to generate ~26-28 ATP via chemiosmosis.</text>

      <!-- Key Exam Concept Note -->
      <rect x="40" y="835" width="720" height="80" rx="8" fill="#fef3c7" stroke="#fcd34d" />
      <text x="60" y="860" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#92400e">CRITICAL EXAM TAKEAWAYS:</text>
      <text x="60" y="882" font-family="system-ui, sans-serif" font-size="13" fill="#78350f">1. DNP (dinitrophenol) uncouples proton gradient, generating heat instead of ATP.</text>
      <text x="60" y="902" font-family="system-ui, sans-serif" font-size="13" fill="#78350f">2. Phosphofructokinase (PFK) is the allosteric rate-limiting pacemaker enzyme of glycolysis.</text>

      <text x="350" y="970" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">Page 168 · Principles of Biochemistry</text>
    `),
  },
  {
    id: 'neuro-action-potentials',
    title: 'Neurobiology: Action Potentials & Synaptic Transmission',
    subject: 'Neuroscience & Medicine',
    type: 'Textbook Page',
    badge: 'Medical School',
    description: 'Resting membrane potential, voltage-gated Na+/K+ channels, refractory periods, and neurotransmitter exocytosis.',
    svgDataUrl: createSvgDataUrl(`
      <rect x="0" y="0" width="800" height="70" fill="#7c3aed" />
      <text x="40" y="44" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">MEDICAL PHYSIOLOGY · NEURONAL EXCITABILITY</text>
      
      <text x="40" y="110" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">Ionic Basis of the Action Potential</text>
      
      <rect x="40" y="130" width="720" height="120" rx="8" fill="#faf5ff" stroke="#e9d5ff" />
      <text x="60" y="160" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#6d28d9">1. Resting Membrane Potential (RMP = -70 mV):</text>
      <text x="60" y="185" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Maintained by Na+/K+ ATPase (pumps 3 Na+ out, 2 K+ in, consumes 1 ATP).</text>
      <text x="60" y="205" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• High intracellular K+ concentration; high extracellular Na+ and Cl- concentration.</text>
      <text x="60" y="225" font-family="system-ui, sans-serif" font-size="13" fill="#475569">• Potassium leak channels create higher resting permeability to K+ than Na+.</text>

      <rect x="40" y="265" width="720" height="210" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="295" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Action Potential Phases:</text>
      <text x="60" y="325" font-family="system-ui, sans-serif" font-size="14" fill="#334155"><tspan font-weight="bold" fill="#7c3aed">A. Depolarization:</tspan> Stimulus reaches threshold (-55 mV). Voltage-gated Na+ channels rapidly open.</text>
      <text x="60" y="347" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">   Massive influx of Na+ drives membrane potential towards +30 mV.</text>
      
      <text x="60" y="375" font-family="system-ui, sans-serif" font-size="14" fill="#334155"><tspan font-weight="bold" fill="#7c3aed">B. Repolarization:</tspan> At +30 mV, voltage-gated Na+ channel inactivation gates close.</text>
      <text x="60" y="397" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">   Delayed rectifier voltage-gated K+ channels open, allowing rapid efflux of K+ ions.</text>
      
      <text x="60" y="425" font-family="system-ui, sans-serif" font-size="14" fill="#334155"><tspan font-weight="bold" fill="#7c3aed">C. Hyperpolarization (Afterpotential):</tspan> K+ channels close sluggishly.</text>
      <text x="60" y="447" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">   Membrane dips below -70 mV toward K+ equilibrium potential (-90 mV) before stabilizing.</text>

      <rect x="40" y="490" width="720" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="520" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Refractory Periods & Conduction:</text>
      <text x="60" y="545" font-family="system-ui, sans-serif" font-size="13" fill="#334155"><tspan font-weight="bold">Absolute Refractory Period:</tspan> Na+ channels are inactivated; absolutely NO new action potential can fire.</text>
      <text x="60" y="570" font-family="system-ui, sans-serif" font-size="13" fill="#334155"><tspan font-weight="bold">Relative Refractory Period:</tspan> Suprathreshold stimulus can fire an AP because some Na+ channels have reset.</text>
      <text x="60" y="595" font-family="system-ui, sans-serif" font-size="13" fill="#334155"><tspan font-weight="bold">Saltatory Conduction:</tspan> In myelinated axons (Schwann cells in PNS, Oligodendrocytes in CNS),</text>
      <text x="60" y="615" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">impulses jump from Node of Ranvier to Node of Ranvier, increasing conduction velocity up to 120 m/s.</text>

      <rect x="40" y="655" width="720" height="160" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="685" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Chemical Synapse Mechanism:</text>
      <text x="60" y="710" font-family="system-ui, sans-serif" font-size="13" fill="#334155">1. Action potential invades the axon terminal.</text>
      <text x="60" y="730" font-family="system-ui, sans-serif" font-size="13" fill="#334155">2. Depolarization opens voltage-gated Ca2+ channels; Ca2+ rushes into the presynaptic terminal.</text>
      <text x="60" y="750" font-family="system-ui, sans-serif" font-size="13" fill="#334155">3. Ca2+ binds to Synaptotagmin, triggering SNARE proteins (syntaxin, SNAP-25, synaptobrevin) to fuse vesicles.</text>
      <text x="60" y="770" font-family="system-ui, sans-serif" font-size="13" fill="#334155">4. Neurotransmitter is released into synaptic cleft and binds to ligand-gated postsynaptic receptors.</text>
      <text x="60" y="790" font-family="system-ui, sans-serif" font-size="13" fill="#334155">5. Signal termination via enzymatic cleavage (e.g. Acetylcholinesterase) or reuptake transporters.</text>

      <text x="350" y="950" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">Guyton & Hall Medical Physiology</text>
    `),
  },
  {
    id: 'chem-reactions',
    title: 'Organic Chemistry: Sn1 vs Sn2 Reactions',
    subject: 'Organic Chemistry',
    type: 'Handwritten Notes',
    badge: 'Lecture Notes',
    description: 'Nucleophilic substitution comparison: mechanisms, kinetics, stereochemistry, solvent effects, and carbocation stability.',
    svgDataUrl: createSvgDataUrl(`
      <rect width="800" height="1000" fill="#fffdfa" />
      <rect x="0" y="0" width="800" height="1000" fill="url(#lines)" opacity="0.6"/>
      
      <!-- Red margin line -->
      <line x1="90" y1="0" x2="90" y2="1000" stroke="#fca5a5" stroke-width="2"/>

      <text x="110" y="45" font-family="'Comic Sans MS', cursive, sans-serif" font-size="22" font-weight="bold" fill="#1e293b">CHEM 210: Sn1 vs Sn2 Substitution Cheat Sheet ⚡</text>

      <text x="110" y="85" font-family="'Comic Sans MS', cursive, sans-serif" font-size="16" font-weight="bold" fill="#0369a1">★ Sn2: Substitution Nucleophilic Bimolecular</text>
      <text x="120" y="115" font-family="sans-serif" font-size="13" fill="#334155">• Mechanism: ONE-STEP concerted mechanism (backside attack by nucleophile).</text>
      <text x="120" y="140" font-family="sans-serif" font-size="13" fill="#334155">• Rate Law: Rate = k[Substrate][Nucleophile] (2nd order overall).</text>
      <text x="120" y="165" font-family="sans-serif" font-size="13" fill="#334155">• Stereochemistry: 100% INVERSION of configuration (Walden Inversion, R → S).</text>
      <text x="120" y="190" font-family="sans-serif" font-size="13" fill="#334155">• Substrate preference: Methyl > 1° > 2° (3° NEVER does Sn2 due to steric hindrance!).</text>
      <text x="120" y="215" font-family="sans-serif" font-size="13" fill="#334155">• Nucleophile requirement: STRONG nucleophile required (e.g. CN-, I-, RS-, OH-).</text>
      <text x="120" y="240" font-family="sans-serif" font-size="13" fill="#334155">• Solvent preference: Polar APROTIC solvents (DMSO, DMF, Acetone) - do not solvate nucleophile.</text>

      <!-- Sn1 Section -->
      <text x="110" y="300" font-family="'Comic Sans MS', cursive, sans-serif" font-size="16" font-weight="bold" fill="#b91c1c">★ Sn1: Substitution Nucleophilic Unimolecular</text>
      <text x="120" y="330" font-family="sans-serif" font-size="13" fill="#334155">• Mechanism: TWO-STEP via Carbocation intermediate (Rate Determining Step = loss of leaving group).</text>
      <text x="120" y="355" font-family="sans-serif" font-size="13" fill="#334155">• Rate Law: Rate = k[Substrate] (1st order kinetics, nucleophile does NOT affect rate!).</text>
      <text x="120" y="380" font-family="sans-serif" font-size="13" fill="#334155">• Stereochemistry: RACEMIZATION (attack can happen from top or bottom of planar sp2 carbocation).</text>
      <text x="120" y="405" font-family="sans-serif" font-size="13" fill="#334155">• Substrate preference: 3° > 2° >> 1° (Methyl and 1° carbocations are too unstable!).</text>
      <text x="120" y="430" font-family="sans-serif" font-size="13" fill="#334155">• Carbocation stability order: 3° > 2° > 1° > methyl (stabilized by hyperconjugation and inductive effect).</text>
      <text x="120" y="455" font-family="sans-serif" font-size="13" fill="#334155">• Watch out for: Carbocation rearrangements (Hydride shift 1,2-H and Methyl shift 1,2-CH3)!</text>
      <text x="120" y="480" font-family="sans-serif" font-size="13" fill="#334155">• Nucleophile requirement: WEAK nucleophile is fine (e.g. H2O, MeOH, EtOH).</text>
      <text x="120" y="505" font-family="sans-serif" font-size="13" fill="#334155">• Solvent preference: Polar PROTIC solvents (H2O, MeOH, EtOH) - stabilize ions by hydrogen bonding.</text>

      <!-- Comparison Box -->
      <rect x="110" y="540" width="650" height="230" rx="8" fill="#fef2f2" stroke="#fecaca" />
      <text x="130" y="570" font-family="sans-serif" font-size="15" font-weight="bold" fill="#991b1b">SUMMARY COMPARISON MATRIX</text>
      
      <text x="130" y="605" font-family="monospace" font-size="12" fill="#334155">Feature            | Sn1                           | Sn2</text>
      <text x="130" y="625" font-family="monospace" font-size="12" fill="#334155">--------------------------------------------------------------------------</text>
      <text x="130" y="645" font-family="monospace" font-size="12" fill="#334155">Steps              | 2 steps (carbocation)         | 1 step (concerted)</text>
      <text x="130" y="665" font-family="monospace" font-size="12" fill="#334155">Kinetics           | Rate = k[R-X]                 | Rate = k[R-X][Nu-]</text>
      <text x="130" y="685" font-family="monospace" font-size="12" fill="#334155">Stereochemistry    | Racemization (ret + inv)      | Inversion (Walden)</text>
      <text x="130" y="705" font-family="monospace" font-size="12" fill="#334155">Substrate Order    | 3° &gt; 2° &gt; 1°                  | Methyl &gt; 1° &gt; 2°</text>
      <text x="130" y="725" font-family="monospace" font-size="12" fill="#334155">Nucleophile        | Weak OK                       | Strong required</text>
      <text x="130" y="745" font-family="monospace" font-size="12" fill="#334155">Solvent            | Polar Protic (H2O/ROH)        | Polar Aprotic (DMF/DMSO)</text>

      <text x="120" y="820" font-family="'Comic Sans MS', cursive, sans-serif" font-size="14" font-weight="bold" fill="#475569">Note to self: Leaving group ability mirrors acid strength: I- &gt; Br- &gt; Cl- &gt;&gt; F- (TsO- is super good)</text>
      <text x="500" y="930" font-family="sans-serif" font-size="11" fill="#94a3b8">Prof. Alvarez Organic Chem Lecture 14</text>
    `),
  },
  {
    id: 'cs-algorithms',
    title: 'Computer Science: Graph Algorithms & Dynamic Programming',
    subject: 'Computer Science',
    type: 'Textbook Page',
    badge: 'Algorithms',
    description: 'Dijkstra, Bellman-Ford, Floyd-Warshall, BFS/DFS complexities, and Dynamic Programming optimal substructure.',
    svgDataUrl: createSvgDataUrl(`
      <rect x="0" y="0" width="800" height="70" fill="#0f172a" />
      <text x="40" y="44" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#38bdf8">CS 301 · ADVANCED ALGORITHMS & COMPLEXITY</text>
      
      <text x="40" y="110" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">Graph Shortest Path & Traversal Fundamentals</text>

      <rect x="40" y="130" width="720" height="150" rx="8" fill="#f0fdf4" stroke="#bbf7d0" />
      <text x="60" y="160" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#15803d">1. Dijkstra's Algorithm (Greedy Single-Source Shortest Path):</text>
      <text x="60" y="185" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Finds the shortest path from a starting source node to all other vertices in a weighted graph.</text>
      <text x="60" y="205" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Time Complexity with Min-Heap Priority Queue: O((V + E) log V).</text>
      <text x="60" y="225" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• CRUCIAL LIMITATION: Fails if any edge weights are negative! (Greedy assumption breaks).</text>
      <text x="60" y="245" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Uses relaxation: if dist[u] + weight(u, v) &lt; dist[v], update dist[v].</text>

      <rect x="40" y="295" width="720" height="130" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="325" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">2. Bellman-Ford Algorithm (Handles Negative Edges):</text>
      <text x="60" y="350" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Relaxes all E edges exactly V - 1 times.</text>
      <text x="60" y="370" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Time Complexity: O(V · E), slower than Dijkstra but works with negative weights.</text>
      <text x="60" y="390" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Detects Negative Weight Cycles: if edges can still be relaxed on the V-th iteration, a negative cycle exists.</text>

      <rect x="40" y="440" width="720" height="150" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      <text x="60" y="470" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">3. Floyd-Warshall & Minimum Spanning Trees:</text>
      <text x="60" y="495" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Floyd-Warshall: All-Pairs Shortest Path via Dynamic Programming. Time complexity O(V³).</text>
      <text x="60" y="515" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Kruskal's MST: Sort edges by weight and greedily add with Disjoint Set Union (Union-Find) O(E log E).</text>
      <text x="60" y="535" font-family="system-ui, sans-serif" font-size="13" fill="#334155">• Prim's MST: Grows a cut from a root vertex using a min-priority queue O((V + E) log V).</text>

      <rect x="40" y="605" width="720" height="170" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
      <text x="60" y="635" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#1d4ed8">4. Dynamic Programming Core Principles:</text>
      <text x="60" y="660" font-family="system-ui, sans-serif" font-size="13" fill="#334155">1. Optimal Substructure: An optimal solution contains optimal solutions to subproblems.</text>
      <text x="60" y="680" font-family="system-ui, sans-serif" font-size="13" fill="#334155">2. Overlapping Subproblems: Recursive problem visits the same subproblems repeatedly.</text>
      <text x="60" y="700" font-family="system-ui, sans-serif" font-size="13" fill="#334155">3. Memoization (Top-Down): Cache recursive calls in a hash table or array.</text>
      <text x="60" y="720" font-family="system-ui, sans-serif" font-size="13" fill="#334155">4. Tabulation (Bottom-Up): Iteratively fill a table from base cases forward to eliminate call stack overhead.</text>

      <text x="350" y="940" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">CLRS Introduction to Algorithms · MIT Press</text>
    `),
  },
];
