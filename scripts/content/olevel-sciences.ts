export const olevelPhysics = {
  subjectCode: 'OL-PHY',
  title: 'O-Level Physics — Mechanics, Waves & Electricity',
  description: 'Covers measurement, forces, motion, energy, waves and electricity aligned with the ZIMSEC O-Level Physics syllabus.',
  lessons: [
    {
      title: 'Measurement and SI Units',
      type: 'text' as const,
      content: `# Measurement and SI Units

## Learning Objectives
- State the SI base units
- Use appropriate measuring instruments
- Express measurements in standard form and to significant figures

---

## SI Base Units

| Quantity | Unit | Symbol |
|----------|------|--------|
| Length | metre | m |
| Mass | kilogram | kg |
| Time | second | s |
| Temperature | kelvin | K |
| Electric current | ampere | A |
| Amount of substance | mole | mol |
| Luminous intensity | candela | cd |

---

## Prefixes

| Prefix | Symbol | Multiplier |
|--------|--------|-----------|
| giga | G | 10⁹ |
| mega | M | 10⁶ |
| kilo | k | 10³ |
| centi | c | 10⁻² |
| milli | m | 10⁻³ |
| micro | μ | 10⁻⁶ |
| nano | n | 10⁻⁹ |

**Examples:** 5 km = 5000 m | 3.5 mm = 0.0035 m | 250 μA = 0.00025 A

---

## Significant Figures
The number of meaningful digits in a measurement.

- 3.45 m → 3 sig figs
- 0.0027 g → 2 sig figs (leading zeros don't count)
- 1500 m → ambiguous (2 or 4 sig figs — use standard form)

**Standard form:** 1500 = 1.5 × 10³

---

## Measuring Instruments

| Instrument | Measures | Precision |
|-----------|----------|-----------|
| Ruler | Length | 1 mm |
| Vernier callipers | Length (small) | 0.1 mm |
| Micrometer screw gauge | Very small lengths | 0.01 mm |
| Stopwatch | Time | 0.01 s |
| Thermometer | Temperature | 0.5°C |
| Ammeter | Current | varies |

---

## Errors in Measurement
- **Random errors:** unpredictable, reduced by taking averages
- **Systematic errors:** consistent offset (e.g. wrongly calibrated instrument)
- **Zero error:** instrument reads non-zero when it should read zero
`,
    },
    {
      title: 'Motion — Speed, Velocity and Acceleration',
      type: 'text' as const,
      content: `# Motion — Speed, Velocity and Acceleration

## Learning Objectives
- Distinguish between scalar and vector quantities
- Calculate speed, velocity and acceleration
- Interpret and draw distance–time and velocity–time graphs
- Apply equations of uniformly accelerated motion

---

## Scalar vs Vector

| Scalar (magnitude only) | Vector (magnitude + direction) |
|------------------------|-------------------------------|
| Distance | Displacement |
| Speed | Velocity |
| Mass | Weight |
| Time | Acceleration |
| Energy | Force |

---

## Key Definitions

**Speed** = Distance ÷ Time (m/s)

**Velocity** = Displacement ÷ Time (m/s, with direction)

**Acceleration** = Change in Velocity ÷ Time (m/s²)
$$a = \\frac{v - u}{t}$$

---

## Distance–Time Graphs
- **Horizontal line** → object at rest
- **Straight slope** → constant speed
- **Curved slope** → changing speed
- Gradient = speed

## Velocity–Time Graphs
- **Horizontal line** → constant velocity
- **Positive slope** → acceleration
- **Negative slope** → deceleration
- Gradient = acceleration
- **Area under graph** = distance

---

## Equations of Motion (uniform acceleration)
1. v = u + at
2. s = ut + ½at²
3. v² = u² + 2as
4. s = ½(u + v)t

Where: u = initial velocity, v = final velocity, a = acceleration, t = time, s = displacement

**Example:** A car accelerates from 15 m/s to 35 m/s in 10 s.
a = (35 − 15)/10 = **2 m/s²**
Distance = ½(15 + 35) × 10 = **250 m**

---

## Free Fall
All objects near Earth's surface fall with **g = 10 m/s²** (ignoring air resistance).

**Example:** A stone is dropped from 80 m. How long to fall?
80 = ½ × 10 × t²
t² = 16 → **t = 4 s**
`,
    },
    {
      title: "Forces, Newton's Laws and Pressure",
      type: 'text' as const,
      content: `# Forces, Newton's Laws and Pressure

## Learning Objectives
- State and apply Newton's three laws of motion
- Calculate resultant forces and moments
- Apply the concept of pressure in solids, liquids and gases

---

## Newton's Three Laws of Motion

### First Law (Inertia)
An object remains at rest or moves in a straight line at constant velocity unless acted on by a resultant force.

*"Objects resist changes to their motion."*

### Second Law
The resultant force is proportional to the rate of change of momentum.
$$F = ma$$
Force (N) = Mass (kg) × Acceleration (m/s²)

**Example:** A 2 000 kg car accelerates at 3 m/s². Force = 2000 × 3 = **6 000 N**

### Third Law
For every action there is an equal and opposite reaction.

*"If A exerts a force on B, then B exerts an equal but opposite force on A."*

---

## Weight vs Mass
- **Mass** (kg): amount of matter — doesn't change
- **Weight** (N): gravitational force — W = mg
- On Earth: g = 10 N/kg
- On Moon: g ≈ 1.6 N/kg

---

## Moments and Equilibrium
**Moment** = Force × Perpendicular distance from pivot

$$\\text{Moment} = F \\times d \\text{ (N·m)}$$

**Principle of Moments:** For a balanced object:
Sum of clockwise moments = Sum of anticlockwise moments

---

## Pressure
$$P = \\frac{F}{A}$$
Pressure (Pa or N/m²) = Force (N) ÷ Area (m²)

**Example:** A force of 400 N acts on an area of 0.02 m².
P = 400/0.02 = **20 000 Pa**

### Pressure in Liquids
P = ρgh
where ρ = density (kg/m³), g = 10 m/s², h = depth (m)

**Atmospheric pressure** = 101 325 Pa ≈ 100 kPa
`,
    },
    {
      title: 'Energy, Work and Power',
      type: 'text' as const,
      content: `# Energy, Work and Power

## Learning Objectives
- Define and calculate work done, energy and power
- Apply the principle of conservation of energy
- Distinguish between different forms of energy

---

## Work Done
$$W = F \\times d \\times \\cos\\theta$$
Work (J) = Force (N) × Distance (m) × cos(angle)

When force and motion are in the **same direction** (θ = 0°, cos 0° = 1):
**W = Fd**

**Example:** A force of 50 N moves a box 4 m. W = 50 × 4 = **200 J**
No work is done if: force is perpendicular to motion (carrying a bag horizontally).

---

## Forms of Energy

| Form | Description |
|------|-------------|
| Kinetic energy (KE) | Energy of motion: KE = ½mv² |
| Gravitational PE | Stored energy due to height: GPE = mgh |
| Elastic PE | Stored in stretched/compressed objects |
| Chemical | Stored in bonds (food, fuel, batteries) |
| Thermal | Internal kinetic energy of particles |
| Electrical | Energy of moving charges |
| Nuclear | Released in nuclear reactions |
| Light | Electromagnetic radiation |
| Sound | Mechanical wave energy |

---

## Conservation of Energy
Energy cannot be created or destroyed; it is converted from one form to another.

**Example:** A ball of mass 0.5 kg is dropped from 10 m.
GPE = mgh = 0.5 × 10 × 10 = 50 J
At the bottom: KE = 50 J (if no air resistance)
v = √(2 × KE/m) = √(100/0.5) = √200 ≈ **14.1 m/s**

---

## Power
$$P = \\frac{W}{t} = \\frac{E}{t}$$
Power (W) = Energy or Work (J) ÷ Time (s)

**1 watt = 1 joule per second**

**Example:** A motor lifts 200 kg by 5 m in 10 s.
W = mgh = 200 × 10 × 5 = 10 000 J
P = 10 000/10 = **1 000 W = 1 kW**

---

## Efficiency
$$\\text{Efficiency} = \\frac{\\text{Useful output energy}}{\\text{Total input energy}} \\times 100\\%$$

**Example:** A machine takes in 500 J, outputs 350 J of useful work.
Efficiency = 350/500 × 100 = **70%**
`,
    },
    {
      title: 'Electricity — Circuits, Resistance and Power',
      type: 'text' as const,
      content: `# Electricity — Circuits, Resistance and Power

## Learning Objectives
- Distinguish series and parallel circuits
- Apply Ohm's Law and Kirchhoff's Laws
- Calculate electrical power and energy
- Understand domestic wiring safety

---

## Electric Current, Voltage and Resistance

**Current (I):** flow of charge. Unit: ampere (A). Measured by **ammeter** (in series).
**Voltage/EMF (V):** energy per unit charge. Unit: volt (V). Measured by **voltmeter** (in parallel).
**Resistance (R):** opposition to current. Unit: ohm (Ω).

### Ohm's Law
$$V = IR$$

**Example:** A resistor has R = 20 Ω, V = 12 V. I = V/R = 12/20 = **0.6 A**

---

## Series Circuits
- Same current flows through all components
- Voltages add: V_total = V₁ + V₂ + V₃
- Resistances add: R_total = R₁ + R₂ + R₃

## Parallel Circuits
- Same voltage across all branches
- Currents add: I_total = I₁ + I₂ + I₃
- 1/R_total = 1/R₁ + 1/R₂ + 1/R₃

**Example:** Two 6 Ω resistors in parallel:
1/R = 1/6 + 1/6 = 2/6 → R = **3 Ω**

---

## Electrical Power and Energy
$$P = IV = I^2R = \\frac{V^2}{R}$$
Power (W) = Current (A) × Voltage (V)

**Electrical energy:**
E = Pt (joules) or E = Pt/3 600 000 (kWh)

**Example:** A 2 kW heater runs for 3 hours.
Energy = 2 × 3 = **6 kWh**
Cost at $0.10/kWh = **$0.60**

---

## Domestic Safety
- **Fuse:** melts if current is too high (protects appliance)
- **Circuit breaker:** automatically trips on overload
- **Earth wire:** green/yellow — carries fault current safely to ground
- Live wire: brown | Neutral: blue | Earth: green-yellow
- Never overload sockets
`,
    },
  ],
}

export const olevelChemistry = {
  subjectCode: 'OL-CHEM',
  title: 'O-Level Chemistry — Atomic Structure, Bonding & Reactions',
  description: 'Covers the structure of matter, chemical bonding, reactions and organic chemistry for ZIMSEC O-Level Chemistry.',
  lessons: [
    {
      title: 'Structure of the Atom and the Periodic Table',
      type: 'text' as const,
      content: `# Structure of the Atom and the Periodic Table

## Learning Objectives
- Describe the structure of an atom
- Interpret electronic configuration
- Explain periodicity trends in the Periodic Table

---

## Sub-Atomic Particles

| Particle | Location | Relative mass | Relative charge |
|----------|----------|--------------|----------------|
| Proton | Nucleus | 1 | +1 |
| Neutron | Nucleus | 1 | 0 |
| Electron | Shells (orbitals) | 1/1840 ≈ 0 | −1 |

**Atomic number (Z):** number of protons
**Mass number (A):** protons + neutrons
**Number of electrons** = number of protons (neutral atom)

**Example:** ₁₆³²S — 16 protons, 16 neutrons, 16 electrons

---

## Isotopes
Atoms of the same element with the **same atomic number but different mass numbers** (different number of neutrons).

**Example:** ¹²C and ¹⁴C — both have 6 protons but 6 and 8 neutrons respectively.

---

## Electronic Configuration
Electrons occupy shells in order: 2, 8, 8, 18, ...

| Element | Z | Config |
|---------|---|--------|
| Carbon | 6 | 2, 4 |
| Sodium | 11 | 2, 8, 1 |
| Chlorine | 17 | 2, 8, 7 |
| Calcium | 20 | 2, 8, 8, 2 |

---

## The Periodic Table
- Elements arranged by **increasing atomic number**
- **Period:** horizontal row — same number of electron shells
- **Group:** vertical column — same number of outer electrons → similar chemical properties

### Periodic Trends (left to right across a period):
- Atomic radius **decreases**
- Ionisation energy **increases**
- Electronegativity **increases**
- Metallic character **decreases**

### Group Trends (down a group):
- Atomic radius **increases**
- Ionisation energy **decreases**
- Reactivity of metals **increases**; reactivity of non-metals **decreases**
`,
    },
    {
      title: 'Chemical Bonding',
      type: 'text' as const,
      content: `# Chemical Bonding

## Learning Objectives
- Explain ionic, covalent and metallic bonding
- Draw dot-and-cross diagrams
- Relate bonding to properties

---

## Ionic Bonding
Formed between **metals and non-metals** by transfer of electrons.

- Metal **loses** electrons → positive ion (cation)
- Non-metal **gains** electrons → negative ion (anion)
- Strong electrostatic attraction between oppositely charged ions

**Example:** NaCl formation
Na (2,8,1) → Na⁺ (2,8) + 1e⁻
Cl (2,8,7) + 1e⁻ → Cl⁻ (2,8,8)

**Properties of ionic compounds:**
- High melting/boiling points (strong forces)
- Conduct electricity when dissolved or molten
- Soluble in water (generally)
- Brittle

---

## Covalent Bonding
Formed between **non-metals** by sharing electron pairs.

**Simple covalent (molecular):** H₂O, CO₂, CH₄, NH₃
**Giant covalent (network):** Diamond, Silicon dioxide (SiO₂), Graphite

**Properties of simple covalent:**
- Low melting/boiling points
- Do not conduct electricity (no ions/free electrons)
- Insoluble in water (generally)

**Properties of giant covalent (diamond):**
- Very high melting point
- Very hard
- Does not conduct electricity (except graphite)

---

## Metallic Bonding
Metal cations in a **sea of delocalised electrons**.

**Properties of metals:**
- Good conductors of heat and electricity (free electrons)
- Malleable and ductile (layers can slide)
- High melting/boiling points (mostly)
- Shiny lustre

---

## Bond Summary

| Property | Ionic | Simple covalent | Metallic |
|----------|-------|----------------|---------|
| Melting point | High | Low | Variable (mostly high) |
| Electrical conductivity | When dissolved/molten | No | Yes |
| Solubility in water | Usually soluble | Usually insoluble | Insoluble |
`,
    },
    {
      title: 'Chemical Equations and Calculations',
      type: 'text' as const,
      content: `# Chemical Equations and Calculations

## Learning Objectives
- Write and balance chemical equations
- Understand the mole concept
- Perform molar calculations (mass, volume, concentration)

---

## Balancing Equations
Atoms are **conserved** in chemical reactions.

**Steps:**
1. Write the word equation
2. Write formulae
3. Balance by adjusting coefficients (not subscripts!)

**Example:** Hydrogen burns in oxygen:
H₂ + O₂ → H₂O (unbalanced)
**2H₂ + O₂ → 2H₂O** (balanced ✓)

**Example:** Iron reacts with dilute HCl:
Fe + HCl → FeCl₂ + H₂
**Fe + 2HCl → FeCl₂ + H₂** ✓

---

## The Mole
**1 mole = 6.02 × 10²³ particles** (Avogadro's constant)

Molar mass = mass of 1 mole in grams (= relative atomic or formula mass in g/mol)

$$n = \\frac{m}{M}$$
Moles = mass (g) ÷ molar mass (g/mol)

**Example:** Calculate moles in 11 g of CO₂ (M = 44 g/mol)
n = 11/44 = **0.25 mol**

---

## Gas Volume (at room temperature and pressure)
1 mole of any gas = **24 dm³** at RTP

$$n = \\frac{V}{24}$$

**Example:** 6 dm³ of NH₃ = 6/24 = **0.25 mol**

---

## Solution Concentration
$$c = \\frac{n}{V}$$
Concentration (mol/dm³) = moles ÷ volume (dm³)

**Example:** 0.5 mol NaOH dissolved to make 250 cm³ of solution.
c = 0.5 ÷ 0.25 = **2 mol/dm³**

---

## Percentage Yield
$$\\%\\text{ yield} = \\frac{\\text{actual yield}}{\\text{theoretical yield}} \\times 100\\%$$
`,
    },
    {
      title: 'Types of Chemical Reactions',
      type: 'text' as const,
      content: `# Types of Chemical Reactions

## Learning Objectives
- Classify reactions as acid-base, redox, precipitation or decomposition
- Understand oxidation and reduction in terms of oxygen, hydrogen and electrons
- Apply tests for ions and gases

---

## Acid-Base Reactions
**Acids** release H⁺ ions. **Bases** neutralise acids.

| Reaction | Equation Pattern |
|----------|----------------|
| Acid + Metal → Salt + Hydrogen | Zn + 2HCl → ZnCl₂ + H₂ |
| Acid + Metal Oxide → Salt + Water | CuO + H₂SO₄ → CuSO₄ + H₂O |
| Acid + Carbonate → Salt + Water + CO₂ | CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂ |
| Acid + Alkali → Salt + Water | NaOH + HCl → NaCl + H₂O |

**pH scale:** 0–6 acid | 7 neutral | 8–14 alkaline

---

## Redox Reactions
- **Oxidation:** loss of electrons / gain of oxygen / loss of hydrogen
- **Reduction:** gain of electrons / loss of oxygen / gain of hydrogen

*OIL RIG — Oxidation Is Loss, Reduction Is Gain (of electrons)*

**Example:** Mg + CuSO₄ → MgSO₄ + Cu
- Mg → Mg²⁺ + 2e⁻ (oxidised)
- Cu²⁺ + 2e⁻ → Cu (reduced)
- Mg is the reducing agent; CuSO₄ is the oxidising agent

---

## Electrolysis
Decomposition of an ionic compound using electricity.
- **Anode** (+): oxidation occurs → Cl₂, O₂ produced
- **Cathode** (−): reduction occurs → metals, H₂ produced

**Electrolysis of brine (NaCl solution):**
- Cathode: H⁺ + e⁻ → H₂
- Anode: 2Cl⁻ → Cl₂ + 2e⁻
- Solution left: NaOH (sodium hydroxide)

---

## Tests for Gases

| Gas | Test | Positive result |
|-----|------|----------------|
| H₂ | Burning splint | "Pop" sound |
| O₂ | Glowing splint | Relights |
| CO₂ | Limewater | Turns milky |
| Cl₂ | Damp litmus | Bleaches white |
| NH₃ | Damp red litmus | Turns blue |
`,
    },
    {
      title: 'Organic Chemistry',
      type: 'text' as const,
      content: `# Organic Chemistry

## Learning Objectives
- Understand the basics of carbon chemistry
- Name and draw structures of alkanes and alkenes
- Describe addition and substitution reactions
- Understand polymers

---

## Carbon — The Basis of Life
Carbon forms 4 covalent bonds. It can bond with itself to form:
- **Chains** (straight or branched)
- **Rings**

**Homologous series:** families of organic compounds with the same general formula and functional group.

---

## Alkanes (saturated hydrocarbons)
General formula: **CₙH₂ₙ₊₂**
All single C–C bonds.

| Name | Formula | Structure |
|------|---------|-----------|
| Methane | CH₄ | CH₄ |
| Ethane | C₂H₆ | CH₃−CH₃ |
| Propane | C₃H₈ | CH₃−CH₂−CH₃ |
| Butane | C₄H₁₀ | CH₃−CH₂−CH₂−CH₃ |

**Properties:** flammable, unreactive (apart from combustion)
**Complete combustion:** CH₄ + 2O₂ → CO₂ + 2H₂O
**Substitution reaction** with Cl₂ (UV light): CH₄ + Cl₂ → CH₃Cl + HCl

---

## Alkenes (unsaturated hydrocarbons)
General formula: **CₙH₂ₙ**
Contain a **C=C double bond** → reactive.

| Name | Formula |
|------|---------|
| Ethene | C₂H₄ |
| Propene | C₃H₆ |

**Addition reaction with H₂:** CH₂=CH₂ + H₂ → CH₃−CH₃
**Addition reaction with Br₂ (bromine water):** decolourises orange bromine water — this is the test for alkenes!

---

## Polymers
Monomers join to form long chains (polymers).

**Poly(ethene):** nCH₂=CH₂ → −(CH₂−CH₂)ₙ−
Used for: plastic bags, bottles

**Poly(propene):** carpets, ropes
**Poly(chloroethene) PVC:** pipes, window frames

### Condensation Polymers
**Nylon (polyamide):** clothing, ropes
**Polyester (e.g. Terylene):** clothing, bottles

**Problem with polymers:** non-biodegradable → environmental pollution
`,
    },
  ],
}

export const olevelBiology = {
  subjectCode: 'OL-BIO',
  title: 'O-Level Biology — Life Processes, Genetics & Ecology',
  description: 'Covers cell biology, nutrition, respiration, reproduction, genetics and ecology for ZIMSEC O-Level Biology.',
  lessons: [
    {
      title: 'Cell Structure and Function',
      type: 'text' as const,
      content: `# Cell Structure and Function

## Learning Objectives
- Identify and describe organelles in animal and plant cells
- Compare animal and plant cells
- Explain the functions of each organelle

---

## Animal Cell vs Plant Cell

| Organelle | Animal Cell | Plant Cell | Function |
|-----------|-------------|------------|---------|
| Cell membrane | ✓ | ✓ | Controls what enters/exits |
| Cell wall | ✗ | ✓ | Support and shape (cellulose) |
| Nucleus | ✓ | ✓ | Controls cell activities; contains DNA |
| Cytoplasm | ✓ | ✓ | Medium for chemical reactions |
| Mitochondria | ✓ | ✓ | Site of aerobic respiration (energy) |
| Ribosomes | ✓ | ✓ | Protein synthesis |
| Vacuole | Small/absent | Large (central) | Stores cell sap; maintains turgor |
| Chloroplasts | ✗ | ✓ | Photosynthesis |
| Endoplasmic reticulum | ✓ | ✓ | Transport network; protein synthesis (rough ER) |
| Golgi apparatus | ✓ | ✓ | Packages and secretes proteins |

---

## The Nucleus
- Bounded by **nuclear envelope** (double membrane with pores)
- Contains **chromosomes** (DNA + protein)
- **Nucleolus** produces ribosomes
- Controls all cell activities

---

## Levels of Organisation
Cell → Tissue → Organ → Organ System → Organism

**Example:** Muscle cells → Muscle tissue → Heart → Circulatory system → Human

---

## Cell Specialisation
Cells become specialised for specific functions:
- **Red blood cells:** biconcave, no nucleus, packed with haemoglobin → oxygen transport
- **Root hair cells:** long extension → increased surface area for water absorption
- **Palisade cells:** packed with chloroplasts → photosynthesis
- **Nerve cells:** long axon → rapid impulse transmission
`,
    },
    {
      title: 'Diffusion, Osmosis and Active Transport',
      type: 'text' as const,
      content: `# Diffusion, Osmosis and Active Transport

## Learning Objectives
- Define and explain diffusion, osmosis and active transport
- Explain the importance of each process in living organisms
- Describe the effect of osmosis on animal and plant cells

---

## Diffusion
**Movement of molecules from a region of high concentration to low concentration** (down a concentration gradient) through a **partially permeable membrane** or across a membrane.

**Passive process** — no energy required.

**Examples in biology:**
- Oxygen enters blood capillaries from alveoli
- Carbon dioxide moves from tissues to blood
- Glucose absorbed from small intestine into blood

**Factors affecting rate of diffusion:**
- Concentration gradient (steeper = faster)
- Temperature (higher = faster)
- Surface area (larger = faster)
- Distance (shorter = faster)

---

## Osmosis
**The movement of water molecules from a region of high water potential (dilute solution) to low water potential (concentrated solution) through a selectively permeable membrane.**

Osmosis is a special type of diffusion involving only water.

### In Plant Cells
- **Turgid:** cell in dilute solution — water enters by osmosis — cell swells, becomes firm (turgor pressure)
- **Plasmolysed:** cell in concentrated solution — water leaves — vacuole shrinks, cytoplasm pulls away from wall

### In Animal Cells
- **Haemolysis:** red blood cell in very dilute solution — bursts
- **Crenation:** red blood cell in very concentrated solution — shrivels
- Animal cells need to maintain the right salt concentration in blood (osmoregulation)

---

## Active Transport
**Movement of molecules from low concentration to high concentration using energy (ATP)** — against the concentration gradient.

Requires: energy + carrier proteins

**Examples:**
- Absorption of glucose from small intestine (when glucose concentration in gut is already lower than in blood)
- Re-absorption of glucose in kidney tubules
- Uptake of mineral ions by root hair cells
`,
    },
    {
      title: 'Photosynthesis',
      type: 'text' as const,
      content: `# Photosynthesis

## Learning Objectives
- Write the equation for photosynthesis
- Describe the role of chlorophyll and light
- Explain the factors affecting the rate of photosynthesis
- Describe starch tests

---

## What is Photosynthesis?
The process by which green plants use **light energy** to convert **carbon dioxide and water** into **glucose and oxygen**.

$$6CO_2 + 6H_2O \\xrightarrow{\\text{light, chlorophyll}} C_6H_{12}O_6 + 6O_2$$

Takes place in the **chloroplasts** (contain chlorophyll — the green pigment that absorbs light).

---

## Two Stages of Photosynthesis

### Light-Dependent Reactions (in thylakoid membranes)
- Light energy splits water molecules: **photolysis**
- H₂O → 2H⁺ + ½O₂ + 2e⁻
- Produces ATP and NADPH
- **Oxygen is released** as a by-product

### Light-Independent Reactions / Calvin Cycle (in stroma)
- CO₂ fixed using ATP and NADPH
- Produces **glucose** (G3P → glucose)
- No light directly required

---

## Factors Limiting Photosynthesis

### Light Intensity
More light → faster rate (up to saturation point)

### CO₂ Concentration
More CO₂ → faster rate (at normal light levels)

### Temperature
Rate increases with temperature up to ~35°C, then decreases (enzymes denature)

### Water
Shortage causes stomata to close → less CO₂ enters

---

## Testing a Leaf for Starch
1. Place leaf in boiling water (2 min) — kills cells, stops reactions
2. Place in boiling ethanol — removes chlorophyll (decolourises)
3. Rinse in warm water — soften leaf
4. Add iodine solution:
   - **Blue-black = starch present** (photosynthesis occurred)
   - Yellow-brown = no starch

---

## Uses of Glucose in Plants
- **Respiration** — energy
- **Cellulose** — cell walls
- **Starch** — storage
- **Sucrose** — transport in phloem
- **Amino acids** — combined with nitrogen from soil
`,
    },
    {
      title: 'Respiration',
      type: 'text' as const,
      content: `# Respiration

## Learning Objectives
- Distinguish between breathing and respiration
- Write equations for aerobic and anaerobic respiration
- Compare the two types of respiration
- Explain the role of ATP

---

## What is Respiration?
**Cellular respiration** is the process by which cells release energy from food (glucose) to produce **ATP**.

This is NOT the same as breathing (ventilation)!

---

## ATP — The Energy Currency
ATP (adenosine triphosphate) stores and transfers energy in cells.
- **ATP → ADP + Pᵢ + energy** (when energy is released)
- **ADP + Pᵢ + energy → ATP** (when energy is stored)

---

## Aerobic Respiration
Uses oxygen. Releases maximum energy.

$$C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + \\textbf{38 ATP}$$

**Location:** Cytoplasm (glycolysis) + Mitochondria (Krebs cycle, oxidative phosphorylation)

**Products:** CO₂ (excreted via lungs), H₂O (used or excreted)

---

## Anaerobic Respiration
**Without oxygen.** Releases much less energy.

### In Animals and Bacteria (Lactic Acid Fermentation)
$$C_6H_{12}O_6 \\rightarrow 2C_3H_6O_3 + \\textbf{2 ATP}$$
Glucose → Lactic acid + 2 ATP

Causes **muscle fatigue** during intense exercise.
**Oxygen debt:** extra oxygen needed after exercise to break down lactic acid.

### In Yeast (Alcoholic Fermentation)
$$C_6H_{12}O_6 \\rightarrow 2C_2H_5OH + 2CO_2 + \\textbf{2 ATP}$$
Glucose → Ethanol + Carbon dioxide + 2 ATP

Used in: **bread making** (CO₂ causes dough to rise), **beer and wine brewing** (ethanol)

---

## Comparison

| Feature | Aerobic | Anaerobic |
|---------|---------|-----------|
| Oxygen needed | Yes | No |
| Products | CO₂ + H₂O | Lactic acid OR ethanol + CO₂ |
| ATP yield | 38 | 2 |
| Location | Cytoplasm + mitochondria | Cytoplasm only |
`,
    },
    {
      title: 'Genetics and Inheritance',
      type: 'text' as const,
      content: `# Genetics and Inheritance

## Learning Objectives
- Understand DNA structure and the genetic code
- Explain mitosis and meiosis
- Apply Mendel's laws using genetic diagrams
- Understand mutations and natural selection

---

## DNA Structure
- Double helix made of nucleotides
- Each nucleotide: **sugar (deoxyribose) + phosphate + nitrogenous base**
- Bases: Adenine (A) pairs with Thymine (T); Cytosine (C) pairs with Guanine (G)
- **Gene:** a section of DNA that codes for a protein

---

## Mitosis and Meiosis

| Feature | Mitosis | Meiosis |
|---------|---------|---------|
| Purpose | Growth, repair | Sexual reproduction |
| Divisions | 1 | 2 |
| Daughter cells | 2 | 4 |
| Chromosome number | Same as parent (diploid) | Half parent (haploid) |
| Genetic variation | None | Yes (crossing over + independent assortment) |
| Location | All body cells | Gonads (testes, ovaries) |

---

## Mendelian Genetics

**Genotype:** genetic makeup (e.g. Tt)
**Phenotype:** physical appearance (e.g. tall)
**Dominant:** allele expressed when present (T)
**Recessive:** only expressed when homozygous (tt)

### Monohybrid Cross
**Example:** Tall (TT) × Short (tt) = ?

Parents: TT × tt
Gametes: T , T × t , t
F₁ generation: All Tt (tall) — **100% tall**

F₁ × F₁: Tt × Tt
F₂ generation: TT : Tt : tt = 1:2:1 genotype | **3 tall : 1 short** phenotype

---

## Sex Determination
- Humans: XX (female), XY (male)
- Father determines sex: 50% XX, 50% XY

---

## Mutations
A **mutation** is a change in DNA sequence.
- **Caused by:** radiation (UV, X-rays), chemicals (mutagens), errors in DNA replication
- **Sickle cell anaemia:** mutation in haemoglobin gene — red blood cells become sickle-shaped

---

## Natural Selection (Darwin)
1. Variation exists in a population
2. More offspring produced than can survive (struggle for existence)
3. Those with advantageous variations survive and reproduce
4. Favourable traits are passed on and increase in frequency

**Example:** Antibiotic resistance in bacteria
`,
    },
  ],
}
