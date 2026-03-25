// ─────────────────────────────────────────────────────────────────────────────
// ZIMSEC Heritage-Based Curriculum — Sample School-Based Projects
// MaFundi uses these as annotated teaching examples for students.
// Each project shows the full 6-stage flow with MaFundi's commentary.
// ─────────────────────────────────────────────────────────────────────────────

export type SampleStage = {
  content: string        // The actual written stage content (student voice)
  mafundiNote: string    // MaFundi's annotation explaining WHY this works well
  keyStrengths: string[] // Bullet points of what makes this strong
}

export type SampleProject = {
  slug: string
  title: string
  subject: string
  subjectCode: string
  grade: string
  level: 'primary' | 'olevel' | 'alevel'
  heritageTheme: string
  summary: string
  tags: string[]
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  estimatedMarks: string // e.g. "75–85/100"
  stages: {
    proposal:       SampleStage
    research:       SampleStage
    planning:       SampleStage
    implementation: SampleStage
    evaluation:     SampleStage
  }
  keyLessons: string[]          // What students should learn from this example
  commonMistakes: string[]      // What NOT to do (from this topic)
}

// ── Sample 1: Agriculture — Irrigation Methods ────────────────────────────────
const irrigationProject: SampleProject = {
  slug: 'irrigation-maize-matabeleland',
  title: 'Comparing the Effect of Drip Irrigation and Flood Irrigation on Maize Yield in Sandy Soils of Matabeleland North',
  subject: 'Agriculture',
  subjectCode: 'AGR',
  grade: 'Form 3',
  level: 'olevel',
  heritageTheme: 'Indigenous farming & food systems',
  summary: 'A student from Binga compares two irrigation methods on maize crops, connecting to local water scarcity and traditional farming knowledge.',
  tags: ['water', 'crops', 'food security', 'Matabeleland', 'practical'],
  difficulty: 'intermediate',
  estimatedMarks: '78–85/100',
  stages: {
    proposal: {
      content: `Title: Comparing the Effect of Drip Irrigation and Flood Irrigation on Maize Yield in Sandy Soils of Matabeleland North

Background and Problem:
In my community in Binga, Matabeleland North, water is a scarce and precious resource. We receive an average of 450mm of rainfall per year, and during droughts (which are becoming more frequent due to climate change), many families struggle to grow enough food. Maize is our staple crop — without a good harvest, families go hungry.

Many farmers in our area use flood irrigation because they have always done so, following practices passed down from their parents. However, I have observed that a lot of water is lost when it runs off the sandy soil or evaporates in the heat. An older farmer in our village, Sekuru Sibanda, told me he once used small clay pots buried near plant roots to water slowly — a form of irrigation that sounds similar to what I now know is called "drip irrigation."

My Aims:
1. To compare the amount of water used by drip irrigation vs flood irrigation over a 6-week growing period.
2. To measure and compare the maize plant growth (height, number of leaves) under both methods.
3. To determine which method produces a better yield per litre of water used.
4. To document any traditional water-saving knowledge from community elders.

Hypothesis: I predict that drip irrigation will produce a higher maize yield per litre of water used because water is delivered directly to the roots, reducing evaporation and runoff on sandy soil.

Significance: If drip irrigation proves more efficient, this knowledge could help families in water-scarce areas of Matabeleland grow more food with less water, contributing to food security and reducing the impact of drought.`,
      mafundiNote: `Notice how this proposal immediately grounds the project in a REAL, LOCAL problem — water scarcity in Binga. The student doesn't just say "irrigation is important" — they describe what they PERSONALLY observe in their community. This is what ZIMSEC markers look for: authentic connection to lived experience. Also notice how the student links to Sekuru Sibanda's traditional knowledge — this directly satisfies the Heritage-Based Curriculum requirement of connecting to indigenous knowledge systems. The hypothesis is specific and testable — it gives a reason (reducing evaporation on sandy soil) not just a prediction.`,
      keyStrengths: [
        'Opens with a specific local problem the student personally observes',
        'Connects to traditional/indigenous knowledge (Sekuru Sibanda and clay pots)',
        'Three clear, measurable aims — each is specific and achievable',
        'Hypothesis states both what will happen AND why',
        'Explains community benefit / significance',
      ],
    },
    research: {
      content: `Sources Consulted:
1. Agriculture Textbook, Form 3 (Zimbabwe Schools Examination Council) — Chapter 7: Crop Irrigation
2. Interview with Sekuru Jabul Sibanda, village elder and farmer, Binga District (15 March 2025)
3. Interview with Mr T. Ndlovu, Agriculture teacher, Binga High School (17 March 2025)
4. Zimbabwe National Water Authority (ZINWA) report on Matabeleland North water resources (accessed at school library)
5. Field observation: personal observation of irrigation on 3 farms in Binga over 2 weeks

Key Findings from Research:

Flood Irrigation:
Flood irrigation involves releasing water across the entire soil surface. It is the most common method used in Zimbabwe because it requires no equipment — just furrows dug between rows. However, research shows that flood irrigation has a water use efficiency of only 30–40% in sandy soils. Much water is lost to runoff (water flowing away before being absorbed) and deep percolation (water sinking below the root zone).

Drip Irrigation:
Drip irrigation delivers water slowly and directly to the root zone through small tubes or emitters. It has a water use efficiency of 85–95%. It was first developed in Israel in the 1960s but similar principles existed in many African traditional farming systems. According to my interview with Sekuru Sibanda, some Tonga people historically used "izinkamba zamabere" (clay pots with small holes) buried near roots during dry seasons — a form of subsurface drip irrigation.

Local Context:
Mr Ndlovu told me that most communal farmers cannot afford commercial drip systems, but simple bottle drip kits (using recycled 2-litre bottles) are being promoted by Agritex in our area. This is important for my experiment — I will use the bottle drip method rather than expensive commercial equipment.

Sandy Soils of Matabeleland:
Sandy soils have large particles and poor water retention. Water drains quickly (high permeability). This means flood irrigation is especially wasteful here compared to clay soils. Drip irrigation is therefore theoretically more beneficial in sandy soils than in other soil types.`,
      mafundiNote: `This research stage is strong because it uses MULTIPLE TYPES of sources — a textbook, two interviews (one elder, one teacher), an official report, and personal observation. ZIMSEC markers value diversity of sources. Critically, the student doesn't just copy textbook content — they adapt the knowledge to their LOCAL context (sandy soils, Matabeleland, bottle drip kits, Agritex). Notice how the traditional knowledge from Sekuru Sibanda is developed further here, with the specific Tonga name "izinkamba zamabere" included. This shows depth of engagement with indigenous knowledge, which is a core HBC requirement.`,
      keyStrengths: [
        'Uses 5 different types of sources (textbook, 2 interviews, official report, observation)',
        'Includes specific local expert (Mr Ndlovu, Agritex) and elder (Sekuru Sibanda)',
        'Incorporates indigenous knowledge with specific Tonga language term',
        'Adapts general knowledge to local conditions (sandy soils, bottle drip method)',
        'Numbers and percentages show quantitative research engagement',
      ],
    },
    planning: {
      content: `Materials Required:
- 12 identical plastic seedling trays or similar containers (30cm × 20cm × 15cm)
- Sandy soil collected from the school garden (same batch for all containers)
- Maize seeds — local hybrid variety (Pioneer 3253, from school seed bank)
- 6 recycled 2-litre plastic bottles (for drip irrigation containers)
- Small nail (to make holes in bottle caps — 1mm diameter)
- Measuring tape and ruler
- 1-litre measuring jug (for measuring water volumes)
- Notebook for daily observations
- Scale (borrowed from school laboratory) for weighing maize at harvest

Method:

Step 1: Preparation (Days 1–3)
Fill all 12 containers with the same sandy soil from the same source. Weigh each container to ensure equal amounts of soil (approximately 3kg per container).

Step 2: Planting (Day 4)
Plant 2 maize seeds per container at 3cm depth. All 12 containers planted the same day. Label containers: F1–F6 (Flood Irrigation Group) and D1–D6 (Drip Irrigation Group).

Step 3: Set Up Irrigation Systems (Day 4)
- Flood Group (F1–F6): Water will be poured evenly across the entire soil surface, 200ml per watering session.
- Drip Group (D1–D6): Fill a 2-litre bottle, cap with 1mm hole. Place bottle upside-down next to the plant stem so water drips slowly near the root zone over 4–6 hours. Refill as needed to deliver 200ml per session.

Step 4: Watering Schedule (Days 5–46, 6 weeks)
Water every 2 days (at 7am to reduce evaporation). Record actual water used each time — drip group may need less refills depending on evaporation.

Step 5: Measurements (Every 7 days)
- Plant height (cm): measure from soil surface to tallest leaf tip
- Number of fully-opened leaves
- Visual health score (1–5): 1=wilted/dying, 5=vigorous and healthy

Step 6: Harvest (Day 47)
Count number of cobs per container. Weigh total maize grain per container (grams). Calculate yield per litre of water used.

Variables:
- Independent variable: Irrigation method (flood vs drip)
- Dependent variables: Plant height, leaf count, health score, final grain weight
- Controlled variables: Soil type and quantity, seed variety, planting depth, water volume per session, location (all containers in same outdoor area)

Potential Challenges and Solutions:
- Challenge: Wind may blow water during flood irrigation, wasting some. Solution: Water during calm mornings.
- Challenge: Containers may heat up in sun, affecting soil temperature. Solution: Place all containers in partial shade.`,
      mafundiNote: `This planning stage is excellent because it is SPECIFIC and REPLICABLE. Another person could read this and repeat the exact experiment. Notice the careful attention to controlled variables — this is what separates a good project from a great one in science subjects. The student uses LOCALLY AVAILABLE, AFFORDABLE materials (recycled bottles, school seed bank) — this reflects the HBC principle of using indigenous and local resources. The challenges section shows mature thinking — anticipating problems before they happen is a sign of high-level planning.`,
      keyStrengths: [
        'Specific quantities for every material (3cm depth, 200ml, 1mm hole, 3kg soil)',
        'Controlled variables explicitly identified and listed',
        'Uses recycled/affordable local materials consistent with HBC values',
        'Step-by-step numbered methodology — anyone could repeat this',
        'Challenges section shows higher-order thinking and preparation',
      ],
    },
    implementation: {
      content: `Week 1 (Days 1–7):
All seedlings germinated by Day 6. Flood group seedlings averaged 4.2cm height; Drip group averaged 4.0cm — essentially equal at this stage. Soil in flood containers felt moist to 5cm depth after watering but I noticed water pooling briefly before absorbing — evidence of runoff risk on sandy soil. Drip containers showed visible dark moist spots around the bottle area.

Total water used:
- Flood group: 3 waterings × 200ml × 6 containers = 3,600ml
- Drip group: Average refill was only 140ml per session (bottle lost ~60ml to evaporation at top). Total: 3 × 140ml × 6 = 2,520ml

Week 2 (Days 8–14):
Noticeable difference beginning to appear. Average heights: Flood = 12.8cm; Drip = 15.3cm. I also observed that 2 flood containers (F3 and F5) showed slight yellowing of leaves — possible over-watering or waterlogging in those containers. Drip containers all appeared consistently healthy.

Week 3 (Days 15–21):
Heights: Flood = 22.1cm average; Drip = 27.4cm average. The drip group is now consistently taller. I interviewed Sekuru Sibanda during this week. He visited the experiment and said: "Abantu bakadala babesazi lokhu" (The old people knew this). He confirmed that root-directed water was a principle used in traditional Tonga gardens.

Week 4–5 (Days 22–35):
Strong growth in drip group. Flood group F3 lost one plant (possibly root rot from over-watering). I adjusted flood water amount for remaining containers to 150ml per session from Day 30.

Final Measurements (Day 46):
Plant heights: Flood avg = 48.3cm; Drip avg = 57.2cm (+18.4% taller)
Leaf count: Flood avg = 8.2; Drip avg = 9.8
Health score: Flood avg = 3.6/5; Drip avg = 4.4/5
Maize cobs harvested: Flood = 4 cobs total (6 containers); Drip = 9 cobs total
Grain weight: Flood = 47g total; Drip = 98g total

Total water used across full experiment:
- Flood group: 2,150ml total (adjusted from Day 30)
- Drip group: 1,680ml total
- Drip group used 21.9% less water and produced 108% more grain.`,
      mafundiNote: `This implementation is exceptional because the student records SPECIFIC DATA with dates, quantities, and numbers throughout — not just general observations like "the drip plants grew taller." Notice how an unexpected event (plant F3 dying from root rot) is recorded honestly and the methodology is adjusted — this shows scientific integrity and real-world thinking. The student's decision to REVISIT Sekuru Sibanda during implementation to share findings demonstrates genuine community engagement, not just a one-off interview. The final comparison (21.9% less water, 108% more grain) is powerful and will carry well into the evaluation stage.`,
      keyStrengths: [
        'Daily/weekly data with specific numbers (heights, weights, water volumes)',
        'Unexpected results (root rot in F3) recorded honestly — not hidden',
        'Methodology adapted in response to evidence (reduced flood water Day 30)',
        'Community elder revisited during implementation — genuine engagement',
        'Final data presented clearly for direct comparison between groups',
      ],
    },
    evaluation: {
      content: `Analysis of Results:
My results strongly support my hypothesis. The drip irrigation group produced 108% more maize grain than the flood irrigation group (98g vs 47g) while using 21.9% less water. This means the drip group's water use efficiency was approximately 2.7 times better than the flood group for sandy soil conditions.

My hypothesis was that drip irrigation would produce higher yield per litre of water used. This was confirmed. The research I found suggested drip irrigation has 85–95% efficiency vs 30–40% for flood irrigation, and my experiment showed a consistent advantage for drip irrigation, particularly in sandy soil where water drains quickly before roots can absorb it.

Unexpected Findings:
I did not expect the difference to emerge as early as Week 2. I also did not predict the root rot problem in container F3 — this suggests that flood irrigation can damage maize in containers if over-watered, which may also occur in poorly drained sandy field soils.

Limitations:
1. Scale: My experiment used containers, not field plots. Actual field conditions with deeper roots and more soil volume may give different results.
2. Weather: I conducted this indoors/in partial shade — actual evaporation rates would be higher in a field in Binga.
3. Sample size: Only 6 containers per group — a larger experiment would give more reliable data.

Connection to Heritage and Community:
Sekuru Sibanda's traditional technique of using clay pots for root-directed irrigation was vindicated by this experiment. The principle behind drip irrigation is not new to Tonga farming communities — it was known and practiced long before modern commercial drip systems existed. This project shows that indigenous knowledge systems in Zimbabwe often contain scientifically valid solutions to agricultural challenges.

Conclusion:
Drip irrigation, even when constructed from recycled plastic bottles, significantly outperforms flood irrigation for maize growth in sandy soils. Communities in water-scarce areas of Matabeleland North could increase food production and reduce water usage by adopting bottle-drip irrigation — a technique that uses affordable, locally available materials and is rooted in indigenous Tonga farming knowledge. I recommend Agritex extension officers promote this finding at the ward level.`,
      mafundiNote: `This evaluation is what top-tier ZIMSEC SBP work looks like. Notice three things: First, the student refers BACK to their research (the 85–95% vs 30–40% efficiency figures) and compares it to their actual results — this is "closing the loop" and shows intellectual maturity. Second, the limitations section is honest and specific — not vague ("the experiment wasn't perfect") but concrete ("containers vs field plots," "sample size of 6"). Third, the conclusion returns to the heritage theme and names a specific action (Agritex officers at ward level) — this is community-focused thinking that ZIMSEC's HBC explicitly rewards.`,
      keyStrengths: [
        'References back to research data from the research stage — closes the loop',
        'Calculates and states a specific efficiency ratio (2.7x better)',
        'Limitations are specific and honest, not generic',
        'Heritage connection is elevated — connects indigenous knowledge to scientific validation',
        'Conclusion ends with a specific, actionable recommendation for the community',
      ],
    },
  },
  keyLessons: [
    'Connect your research to local experts AND traditional knowledge holders — use both',
    'Always specify your variables: independent, dependent, and controlled',
    'Record what goes wrong — markers respect honesty more than fake perfect results',
    'Use numbers and measurements at every stage — "taller" is weak; "18.4% taller" is strong',
    'Your conclusion should make a recommendation for your community, not just summarise',
  ],
  commonMistakes: [
    'Saying "drip irrigation is better" without giving specific numbers to prove it',
    'Ignoring traditional/indigenous knowledge when it directly relates to the topic',
    'Only listing materials without explaining the methodology step-by-step',
    'Hiding or not mentioning results that didn\'t match the hypothesis',
  ],
}

// ── Sample 2: Physics — Solar Water Heater ────────────────────────────────────
const solarHeaterProject: SampleProject = {
  slug: 'solar-water-heater-firewood',
  title: 'Constructing and Testing a Low-Cost Solar Water Heater to Reduce Firewood Consumption in Rural Households',
  subject: 'Physics',
  subjectCode: 'PHY',
  grade: 'Form 4',
  level: 'olevel',
  heritageTheme: 'Energy & natural resources',
  summary: 'A Form 4 student builds a solar water heater from local materials and measures how much firewood it replaces in a rural household, connecting to deforestation concerns.',
  tags: ['energy', 'solar', 'deforestation', 'environment', 'practical', 'construction'],
  difficulty: 'advanced',
  estimatedMarks: '82–90/100',
  stages: {
    proposal: {
      content: `Title: Constructing and Testing a Low-Cost Solar Water Heater to Reduce Firewood Consumption in Rural Households

Problem Statement:
In our rural community near Chiredzi, deforestation is a serious problem. Women and children walk up to 4 kilometres to collect firewood every day, and tree cover around the village has decreased visibly in my lifetime. Most of this firewood is used for cooking and heating water. My mother uses approximately 3 large bundles of firewood per week just for heating bathing water for our family of five.

I have learned in Physics that solar energy can be converted to heat energy. The Sun provides free, unlimited energy, and Zimbabwe receives an average of 8–10 hours of sunshine per day — among the highest in the world. This suggested to me that a solar water heater could replace firewood for heating water.

My Aims:
1. To design and construct a functional solar water heater using locally available and affordable materials.
2. To measure the maximum water temperature achievable using the heater under Chiredzi conditions.
3. To calculate how much firewood (by mass) the heater could replace per week for a family of five.
4. To calculate the cost savings and environmental impact over one year.

Hypothesis:
I predict that a solar water heater constructed from black-painted metal, glass/clear plastic, and insulation can heat water to above 50°C under Chiredzi conditions — sufficient for bathing. I predict this will replace at least 60% of firewood currently used for water heating.

Heritage Significance:
Before electricity and modern energy, Zimbabwean communities used the sun to dry food (nyama yomisi — sun-dried meat, and dehwe — sun-dried vegetables). This project revives the principle of using the sun as an energy source and applies it to a modern challenge: deforestation.`,
      mafundiNote: `This proposal is excellent because the student grounds the problem in a PERSONAL, OBSERVABLE reality — their own mother walking 4km for firewood, 3 bundles per week. These specific details are powerful because they make the problem tangible and show the student is not just theorising. Notice also how the student brings in a Physics principle learned in class (solar energy → heat energy) and connects it to a local solution. The heritage connection (nyama yomisi, dehwe) is creative — it shows that using solar energy is not foreign technology but a natural extension of existing Zimbabwean knowledge.`,
      keyStrengths: [
        'Personal, specific observation (3 bundles/week, 4km walk, family of 5)',
        'Connects Physics curriculum content (energy conversion) to real problem',
        'Four measurable aims — each one specific and testable',
        'Heritage connection is original and culturally informed (nyama yomisi, dehwe)',
        'Cost calculation aim shows mature thinking about community impact',
      ],
    },
    research: {
      content: `Physics Principles Researched:
The black body radiation principle states that black surfaces absorb more radiant energy than lighter surfaces. This is why solar collectors are painted black — to maximise heat absorption. According to my textbook, the formula for heat energy gained is Q = mcΔT, where Q is heat energy (J), m is mass of water (kg), c is specific heat capacity of water (4,200 J/kg°C), and ΔT is temperature change.

Construction Materials Research:
I researched three types of solar collectors:
1. Black-painted metal sheet collectors — most efficient but require welding
2. Coiled hosepipe collectors — simple to build, moderate efficiency
3. Repurposed car radiators — very efficient, sometimes available as scrap

I decided to use black-painted hollow tubes (made from biscuit tins bent into shape) because I can make these without professional tools.

Firewood Research:
A standard bundle of firewood in Chiredzi weighs approximately 8–10 kg. The energy content of hardwood (mainly Mopane/Msasa, common trees in Chiredzi) is approximately 17 MJ/kg. A firewood fire at 30% efficiency to heat water therefore provides approximately 5.1 MJ of usable heat per kg of wood.

Interview with Mrs Charity Moyo, Chiredzi South community chairwoman (interview conducted 22 March 2025): "We know the trees are disappearing. Every family uses at least 2–3 bundles of wood per week just for bathing water. If the sun can do that work for free, our mothers and daughters would not suffer." She also noted that the local term for the problem is "matanda ari kupera" (the firewood is finishing).

Interview with Mr Silas Mutengo, Physics teacher: He helped me understand the formulae for heat energy and confirmed my plan was scientifically valid.`,
      mafundiNote: `Strong research because the student uses the Physics formula (Q = mcΔT) from their curriculum — this shows they are not just doing a "craft project" but applying real Physics concepts. The energy calculation for firewood (17 MJ/kg, 30% efficiency) is sophisticated and will enable a genuine quantitative comparison in the evaluation stage. The community interview is particularly strong — Mrs Moyo provides both data (2–3 bundles/week) AND cultural context (the Shona phrase "matanda ari kupera"). Including local language is always valued in HBC assessments.`,
      keyStrengths: [
        'Physics formulae (Q = mcΔT) integrated from curriculum — not just craft',
        'Energy content calculation for firewood — enables quantitative comparison',
        'Community interview gives local context AND cultural language (matanda ari kupera)',
        'Three construction options researched before choosing one — shows decision-making',
        'Teacher interview validates scientific approach',
      ],
    },
    planning: {
      content: `Materials List and Estimated Costs:
- 4 empty biscuit tins (rectangular, collected free from shops) — $0
- Black spray paint (1 can) — $2.00
- Clear plastic sheet (from grain storage bag) — $0.50
- Old wooden board for frame (from scrap) — $0
- Silicone sealant or clay for sealing joints — $1.50
- 2m garden hose — $3.00
- Old inner tube strips for insulation on back of panel — $0.50
- 5-litre water container — $1.00
- Thermometer (borrowed from school laboratory) — $0
Total estimated cost: $8.50

Construction Steps:
1. Cut biscuit tins open, flatten them, and join edge-to-edge to form a rectangular panel (60cm × 40cm).
2. Punch small holes along two sides for water entry and exit tubes.
3. Connect garden hose at entry and exit points and seal with silicone/clay.
4. Paint entire metal panel and hose black (2 coats).
5. Mount panel in wooden frame. Line back and sides with inner tube strips for insulation.
6. Cover front with clear plastic sheet stretched tightly across the frame.
7. Connect a raised water container (5 litres) as a reservoir — gravity feeds water into the panel and hot water rises back out (thermosiphon principle).

Testing Plan:
- Place the panel facing north at a 30° angle from horizontal (optimal for Chiredzi latitude 21°S).
- Fill system with exactly 3 litres of water at a known starting temperature (measure at 6am).
- Measure water temperature every hour from 7am to 5pm on 5 different sunny days.
- Record air temperature alongside for comparison.
- Calculate maximum temperature reached and average daily heating performance.

Control experiment:
Heat 3 litres of water on a firewood fire, recording wood mass used and time taken to reach the same temperature as solar heater.`,
      mafundiNote: `The planning stage stands out because the student designs a CONTROL EXPERIMENT — heating the same volume of water by firewood to enable a direct comparison. This is genuine experimental design. The cost calculation ($8.50 total) is specific and realistic, demonstrating the project's relevance to low-income rural households. The thermosiphon principle shows the student has applied Physics beyond what was taught in class — self-directed learning that ZIMSEC markers reward highly.`,
      keyStrengths: [
        'Total cost listed ($8.50) — makes affordability argument concrete',
        'Thermosiphon principle shows Physics knowledge beyond the syllabus',
        'Control experiment designed (firewood heating for comparison)',
        'Panel angle (30°) calculated for Chiredzi\'s latitude — shows Physics application',
        'Sourcing free/scrap materials demonstrates HBC resourcefulness principle',
      ],
    },
    implementation: {
      content: `Construction (Days 1–4):
Construction took longer than planned — sealing the biscuit tin joints without proper welding was difficult. I eventually used a mixture of clay and ash (suggested by my grandmother, who uses it to seal clay pots) rather than the silicone sealant I had planned. This was more effective and cost nothing.

Testing Results (5 sunny days, Chiredzi, April 2025):

Day 1: Starting temp 18°C. Maximum temp reached: 54°C (at 1pm). Total heating time: 7 hours.
Day 2: Starting temp 21°C. Maximum temp: 62°C (at 12:30pm). Clear day.
Day 3: Starting temp 19°C. Maximum: 48°C (partial cloud cover).
Day 4: Starting temp 22°C. Maximum: 67°C. Full sun all day.
Day 5: Starting temp 20°C. Maximum: 58°C.

Average maximum temperature: 57.8°C
Average start temperature: 20°C
Average ΔT = 37.8°C

Using Q = mcΔT: Q = 3kg × 4,200 J/kg°C × 37.8°C = 476,280 J = 476.3 kJ per day

Firewood Control Experiment:
Heated 3 litres from 20°C to 57.8°C using Mopane firewood. Used 0.72kg of wood, took 18 minutes.
Using the energy content: 0.72kg × 17,000 kJ/kg × 0.30 efficiency = 3,672 kJ (much more energy used — most wasted as radiated heat).

Firewood Replacement Calculation:
My family heats approximately 15 litres of water daily for bathing (5 people × 3 litres each).
If solar heater produces 476kJ from 3 litres → scales to approximately 2,380 kJ for 15 litres (5 panels, or 1 panel × 5 days).
This is equivalent to 0.47 kg of firewood per day, or approximately 3.3kg per week — almost half of one standard bundle.`,
      mafundiNote: `The most memorable moment in this implementation is when the student's grandmother suggests using clay and ash as a sealant — and it works better than the planned silicone. This shows the project is genuinely alive and responsive. The student applies Q = mcΔT to actual data — this is the Physics in action. The firewood replacement calculation, even though it requires scaling (5 panels for full family use), shows strong mathematical reasoning. Recording partial cloud cover results (Day 3, 48°C) rather than only the best results shows scientific integrity.`,
      keyStrengths: [
        'Grandmother\'s traditional knowledge (clay and ash sealant) solves a real problem',
        'Q = mcΔT applied to real measured data — curriculum Physics in use',
        'Partial cloud day (Day 3) included — not hiding imperfect results',
        'Energy comparison between solar and firewood is quantitative and rigorous',
        'Scaling calculation to family-size use shows practical thinking',
      ],
    },
    evaluation: {
      content: `Analysis:
My solar water heater achieved an average maximum temperature of 57.8°C — well above the 50°C I predicted in my hypothesis. The hypothesis was supported. The heater performs well under Chiredzi conditions, consistent with the high solar irradiance this region receives.

Physics Application:
Using Q = mcΔT, the heater provides approximately 476 kJ per 3 litres per day. This is thermodynamically equivalent to using approximately 0.47kg of firewood (at 30% firewood efficiency). For a family of five heating 15 litres, the equivalent saving is approximately 3.3kg of firewood per day, or about 24kg per week — nearly three standard bundles.

My original hypothesis predicted 60% replacement of firewood for water heating. The data suggests this is achievable but would require 4–5 panels, not just one. One panel replaces approximately 40–45% of weekly firewood for water heating.

Limitations:
1. Testing was done in April (autumn) — summer temperatures may be higher; winter results lower.
2. Only one panel built and tested — a multi-panel system was not constructed.
3. Panel loses heat overnight — water heated during the day cools by evening.
4. Cloudy/rainy days reduce performance significantly.

Heritage and Community Value:
This project demonstrates that solar water heating is not a luxury technology. For less than $10 in materials (using scrap and recycled components), a family can significantly reduce their firewood consumption. If every household in our village built one panel, the weekly saving would be equivalent to 480 fewer firewood bundles — significantly reducing tree loss. This project also shows that combining Physics knowledge with traditional skills (clay/ash sealing from my grandmother) can solve community problems better than either alone.

Conclusion:
A low-cost solar water heater constructed from local and recycled materials can heat water to above 50°C under Chiredzi conditions, replacing approximately 40–45% of firewood used for household water heating. With multiple panels, complete replacement of firewood for water heating is achievable. I recommend the Chiredzi Rural District Council include a solar water heater demonstration at their next Tariro Farming Day to teach this technique to rural households at scale.`,
      mafundiNote: `This evaluation demonstrates the highest level of analysis for a Form 4 student. The key insight is the honest re-examination of the hypothesis: the student predicted 60% replacement but found 40–45%, and explains WHY the hypothesis was partially wrong (one panel vs multiple panels needed). This is scientific maturity — not hiding a discrepancy but explaining it. The community recommendation (Chiredzi Rural District Council, Tariro Farming Day) is specific and realistic. The closing observation — that combining Physics knowledge with the grandmother's traditional skill was more effective than either alone — is a profound conclusion about the value of both modern and indigenous knowledge.`,
      keyStrengths: [
        'Revisits hypothesis honestly — explains partial discrepancy (40% vs predicted 60%)',
        'Scales findings to village-wide impact (480 fewer bundles) — community thinking',
        'Connects grandmother\'s contribution to the conclusion — values indigenous knowledge',
        'Specific, realistic community recommendation (RDC, Tariro Farming Day)',
        'Identifies seasonal limitation (April testing) — shows awareness of context',
      ],
    },
  },
  keyLessons: [
    'Apply Physics formulas (Q = mcΔT, energy efficiency) to real data — not just in exams',
    'A partial result is not a failure — explain WHY the hypothesis wasn\'t fully met',
    'Traditional knowledge (grandmother\'s clay/ash) can solve problems modern materials cannot',
    'Scale your findings: what difference would this make for 1 family? For the whole village?',
    'Community recommendations make your conclusion actionable, not just academic',
  ],
  commonMistakes: [
    'Building something without applying Physics formulae — it becomes a craft project, not Physics SBP',
    'Only testing on the best sunny days — record all conditions including cloudy days',
    'Not calculating cost of materials — affordability is a core requirement for community relevance',
    'Concluding "solar energy is better" without calculating the quantitative comparison',
  ],
}

// ── Sample 3: Biology — Medicinal Plants ─────────────────────────────────────
const medicinalPlantsProject: SampleProject = {
  slug: 'medicinal-plants-traditional-healers',
  title: 'Documenting Medicinal Plants Used by N\'anga and Traditional Healers in Hurungwe District and Investigating Their Active Properties',
  subject: 'Biology',
  subjectCode: 'BIO',
  grade: 'Form 4',
  level: 'olevel',
  heritageTheme: 'Cultural heritage & oral traditions',
  summary: 'A student documents medicinal plant knowledge from traditional healers in Hurungwe, cross-referencing with Biology curriculum to investigate active compounds.',
  tags: ['plants', 'traditional medicine', 'biodiversity', 'culture', 'research'],
  difficulty: 'intermediate',
  estimatedMarks: '76–82/100',
  stages: {
    proposal: {
      content: `In my community in Hurungwe, there are three n'anga (traditional healers) who have treated people for generations using plants found in the local forests. I have observed that some patients with common ailments (fever, stomach problems, skin infections) recover well under n'anga treatment, while others seek clinic medicines. This made me curious about the scientific basis of these plants.

My grandmother uses "murara" (African wormwood/Artemisia afra) whenever any of us have colds or chest problems. When I researched this plant for a class project, I found it is used across Africa and has been scientifically studied for its antimicrobial properties.

Aims:
1. To document (catalogue) at least 8 medicinal plants used by traditional healers in Hurungwe, with their local Shona names, uses, and preparation methods.
2. To identify the scientific names of each plant by cross-referencing with a botany reference.
3. To investigate the active compounds (antibacterial, anti-inflammatory, antifungal) of 3 selected plants using simple laboratory tests.
4. To document how this knowledge is passed on (oral tradition, apprenticeship) and assess the risk of this knowledge being lost.

Significance: Zimbabwe's traditional plant medicine represents thousands of years of accumulated knowledge about biodiversity and healing. As deforestation and urbanisation increase, both the plants and the knowledge about them are disappearing. This project aims to document and preserve this heritage knowledge while connecting it to modern Biology.`,
      mafundiNote: `This proposal is strong because it is driven by genuine personal curiosity — the student has grown up with this knowledge (murara for colds) and wants to understand it scientifically. This personal connection gives the project authenticity that markers recognise. The fourth aim (documenting how knowledge is passed on) is sophisticated — it goes beyond the Biology syllabus into cultural heritage preservation, which is a core HBC value. The "risk of being lost" framing shows the student understands why this matters beyond just the science.`,
      keyStrengths: [
        'Personal experience (grandmother and murara) gives authentic starting point',
        'Aim 4 (knowledge transmission and loss) shows HBC cultural awareness',
        'Connects traditional knowledge to scientific investigation — not one OR the other',
        'Identifies both biological AND cultural significance of the project',
      ],
    },
    research: {
      content: `I consulted with three n'anga in Hurungwe district: VaChirinda (age 72), Ambuya VaTambara (age 65), and Sekuru VaMoyo (age 78). Each gave permission for me to document their knowledge.

Plants documented (8 plants total):
1. Murara (Artemisia afra) — Used for respiratory problems, fever, and malaria symptoms. Leaves boiled in water, steam inhaled.
2. Mufandichimuka (Zanthoxylum capense) — Toothache, gum infections. Bark chewed or decocted.
3. Munamatira (Combretum zeyheri) — Diarrhoea and stomach cramps. Root bark boiled.
4. Mupangara (Securidaca longepedunculata) — Snake bite treatment, headache. Root powder used.
5. Muvengahonye (Lantana camara) — Skin infections, wounds. Leaves crushed and applied.
6. Mutamba (Strychnos cocculoides) — Fever and malaria. Bark decoction.
7. Muhacha (Parinari curatellifolia) — Nutritional supplement, general weakness. Fruit eaten.
8. Musodzamapere (Securinega virosa) — Diarrhoea. Roots boiled.

Active compounds identified in scientific literature (school library):
- Artemisia afra: Contains artabsin, absinthin — shown in studies to have antimalarial and antimicrobial effects.
- Lantana camara: Contains lantadene — has antibacterial properties. Caution: some parts of the plant are toxic in high doses.
- Securidaca longepedunculata: Contains saponins and alkaloids — traditionally used widely across Africa.

Knowledge Transmission:
All three n'anga said their knowledge was passed orally and through apprenticeship — "we do not write it down." VaChirinda said: "Ndiri kutya kuti zvinhu izvi zvichaparara tisu tatopera" (I fear these things will vanish when we have gone). This confirms the urgent need to document this knowledge.`,
      mafundiNote: `This research is exemplary because the student conducts PRIMARY RESEARCH (3 interviews with n'anga) AND cross-references with secondary sources (scientific literature). The documentation of traditional names alongside scientific names is exactly what ZIMSEC expects in a Biology HBC project. The direct quote from VaChirinda in Shona ("Ndiri kutya kuti...") is powerful — it shows genuine human connection and gives the project emotional as well as scientific weight. The Lantana camara caution (noting toxicity) shows that the student understands the responsibility involved in documenting medicinal plants.`,
      keyStrengths: [
        'Three primary source interviews with n\'anga (named, aged, consented)',
        'Both Shona names and scientific names documented',
        'Cross-references traditional uses with published scientific evidence',
        'Shona direct quote from VaChirinda — genuine community voice',
        'Notes toxicity caution for Lantana — shows responsible scientific thinking',
      ],
    },
    planning: {
      content: `Selected 3 plants for laboratory testing:
1. Murara (Artemisia afra) — most common in community
2. Muvengahonye (Lantana camara) — used for infections (testable with antibacterial test)
3. Munamatira (Combretum zeyheri) — used for stomach bacteria (testable)

Laboratory Tests:
Test 1 — Paper Disc Diffusion Test (antibacterial):
- Prepare extract: Crush 10g of fresh leaves in 50ml distilled water (cold extraction).
- Soak 3 small paper discs (cut from filter paper) in the extract.
- Place discs on an agar plate already inoculated with E. coli (if available from school lab) OR observe growth inhibition using natural bacteria from unwashed produce.
- Measure any zone of inhibition around the disc after 24–48 hours.

Test 2 — Phytochemical screening (simple):
- Tannins test: Add ferric chloride solution to extract. Blue-black colour indicates tannins present.
- Saponins test: Shake extract vigorously. Persistent froth indicates saponins.
- Alkaloids test: Add Dragendorff's reagent (if available). Orange precipitate = alkaloids present.

Note: Some reagents may not be available at school. I will conduct what I can with available materials and note limitations.

Ethical Considerations:
I will not publish specific preparation doses or therapeutic claims — I am documenting, not prescribing. I have the consent of all three n'anga to document their knowledge.`,
      mafundiNote: `The planning section shows scientific maturity in two ways: First, the student explicitly acknowledges that some reagents may not be available and plans to note this as a limitation — this is honest, professional scientific thinking. Second, the ethical considerations paragraph is outstanding — very few Form 4 students think to include this, but it is crucial when working with traditional medical knowledge and human subjects. ZIMSEC moderators are increasingly expecting this kind of ethical awareness in HBC projects.`,
      keyStrengths: [
        'Honest acknowledgment that some lab reagents may not be available',
        'Ethical considerations paragraph — rare at Form 4 level, highly valued by ZIMSEC',
        'Three distinct phytochemical tests — shows breadth of Biology knowledge',
        'Note that project documents, not prescribes — shows responsibility',
      ],
    },
    implementation: {
      content: `Plant collection: Collected fresh samples of all 3 plants from forests near Hurungwe with permission from VaChirinda who guided me to the correct plants (avoiding misidentification).

Antibacterial Test Results:
I could not obtain pure E. coli culture from school lab. Instead, I tested against natural mold growing on old bread (not ideal but the only option available). Results:
- Murara extract: Clear zone around disc — 6mm diameter zone of inhibition observed.
- Lantana camara: Larger zone — 9mm diameter.
- Combretum zeyheri: Small zone — 3mm (less clear, possibly due to lower concentration).

Phytochemical Results:
Murara: Tannins (+), Saponins (+), Alkaloids (weak positive)
Lantana camara: Tannins (++), Alkaloids (+)
Combretum zeyheri: Tannins (+), Saponins (++)

Additional qualitative observation:
The murara extract had a very strong aromatic smell. VaChirinda told me that n'anga use this smell as a diagnostic tool — if the smell is strong, the plant is "mature and potent." This connects the sensory/experiential knowledge of n'anga to the chemical reality of volatile oils in the plant.`,
      mafundiNote: `The improvisation here (using bread mold instead of E. coli) is completely valid — what matters is that the student explains why, notes it as a limitation, and still obtains meaningful results. The final observation — connecting VaChirinda's "strong smell = mature plant" insight to the scientific concept of volatile oils — is the kind of insight that earns full marks. It shows the student is genuinely thinking about the RELATIONSHIP between traditional and scientific knowledge, not just listing them separately.`,
      keyStrengths: [
        'Improvisation (bread mold) is honest and explained — not hidden as E. coli',
        'VaChirinda guided plant collection — genuine collaboration, not just extraction of knowledge',
        'Volatile oils/aromatic smell connection between n\'anga knowledge and chemistry is original insight',
        'Quantitative measurements (zone sizes in mm) even with improvised method',
      ],
    },
    evaluation: {
      content: `The laboratory tests confirmed that all three plants contain active phytochemicals (tannins, saponins, alkaloids) consistent with the traditional uses documented. Lantana camara showed the strongest apparent antibacterial activity (9mm zone), which aligns with its traditional use for skin infections.

Limitations:
1. Using bread mold instead of a pure bacterial culture is a significant limitation — the results are indicative only, not scientifically conclusive.
2. Concentrations of extracts were not standardised — different batches may give different results.
3. I could not test anti-malarial properties, which are the most important traditional use for murara.

Heritage Finding:
Perhaps the most important finding is not the laboratory results but the oral tradition documentation. All three n'anga expressed concern that young people are no longer learning from them, and this knowledge faces extinction. VaChirinda said he has no apprentice. My documentation of 8 medicinal plants, with Shona names, scientific names, preparation methods, and the n'anga who uses them, is itself a contribution to preserving Zimbabwe's intangible cultural heritage.

Conclusion:
The medicinal plants used by n'anga in Hurungwe contain scientifically identifiable active compounds consistent with their traditional applications. However, the most urgent finding is cultural: this knowledge is at risk of being permanently lost. I recommend that the Ministry of Health and Child Care, in collaboration with NMMZ (National Museums and Monuments of Zimbabwe), create a formal programme to document traditional medicinal plant knowledge across all provinces before the elders who hold it pass on.`,
      mafundiNote: `This evaluation does something remarkable — it elevates the conclusion beyond the Biology results to a broader cultural finding: the knowledge itself is as endangered as the plants. This shows a student who has genuinely engaged with the HBC philosophy, not just the Biology syllabus. The recommendation (Ministry of Health + NMMZ collaboration) is sophisticated and shows the student has thought about which institutions actually have the mandate and resources to act on this. This is the kind of thinking that earns distinction-level marks.`,
      keyStrengths: [
        'Honest about lab limitations without dismissing the results',
        'Elevates heritage documentation as a finding in itself — not secondary to the lab results',
        'Institutional recommendation (Ministry + NMMZ) shows policy-level thinking',
        'Full circle — returns to VaChirinda\'s quote from research stage, no apprentice',
      ],
    },
  },
  keyLessons: [
    'Interview multiple knowledge holders and name them — not just "a traditional healer"',
    'Include direct quotes in the local language — always translate, but include the original',
    'Ethical considerations matter — especially when documenting sensitive cultural knowledge',
    'A conclusion about cultural loss can be as powerful as a scientific conclusion',
    'Improvised methods are acceptable — but be honest about what they can and cannot prove',
  ],
  commonMistakes: [
    'Saying "traditional medicine works" without any evidence or nuance about when and how',
    'Copying Wikipedia descriptions of plants without interviewing actual knowledge holders',
    'Only reporting what worked — not what couldn\'t be tested and why',
    'Forgetting to identify scientific names alongside traditional names',
  ],
}

// ── Sample 4: Geography — Water Sources ───────────────────────────────────────
const watershedProject: SampleProject = {
  slug: 'deforestation-water-manicaland',
  title: 'Investigating the Relationship Between Tree Cover Loss and Reduced Streamflow in the Nyazura River Catchment, Manicaland',
  subject: 'Geography',
  subjectCode: 'GEO',
  grade: 'Form 3',
  level: 'olevel',
  heritageTheme: 'Local environment & ecology',
  summary: 'A student maps tree cover change against local river flow data in Manicaland, connecting to traditional beliefs about sacred forests as water guardians.',
  tags: ['rivers', 'trees', 'ecology', 'maps', 'community', 'Manicaland'],
  difficulty: 'intermediate',
  estimatedMarks: '74–80/100',
  stages: {
    proposal: {
      content: `The Nyazura River used to flow year-round when my father was a child. Now it dries up every dry season from July to October. Farmers in our area in Manicaland tell me this has been getting worse over 20–30 years. I can see from my own observations that the hillsides above the river are much more bare now than the old photographs in our school show.

My grandfather (Sekuru Chimuti) says this is because people cut down the musasa and mufuti trees that "feed the river." In traditional Shona belief, certain forests (called "mucha" or sacred groves) were protected because communities understood they were connected to water sources. Many of these groves have been cut down.

I want to investigate whether there is a measurable relationship between tree cover and river flow in our catchment.

Aims:
1. To map and estimate the percentage of tree cover in the Nyazura catchment area in 2025 vs historical descriptions.
2. To record river water level at the same point over 8 weeks (wet and dry season boundary).
3. To interview community members to collect oral historical data on river flow and tree cover change.
4. To examine the traditional Shona "mucha" (sacred grove) concept as a form of indigenous environmental protection.`,
      mafundiNote: `The strongest element of this proposal is how the student connects a personal family observation (the river drying up) to both a scientific question AND a traditional knowledge system (mucha sacred groves). This is exactly the intersection that HBC projects should occupy. The phrase "feeds the river" from the grandfather is a culturally specific idea that the student will later investigate scientifically — this is good planning of the narrative arc of the project.`,
      keyStrengths: [
        'Opens with a personal, historically grounded observation (father\'s childhood vs now)',
        'Shona cultural concept (mucha/sacred grove) introduced in the proposal',
        'Aims cover mapping, measurement, oral history, and cultural analysis — breadth',
        'Traditional knowledge framed not as superstition but as environmental practice',
      ],
    },
    research: {
      content: `Hydrology research (textbook + teacher):
Trees regulate water through: (1) Interception — leaves catch rain and release it slowly; (2) Transpiration — roots draw water from deep soil and release it; (3) Root systems increase soil infiltration, reducing surface runoff; (4) Leaf litter improves soil organic matter and water retention. Removing trees therefore increases flash flooding (more runoff) AND reduces dry-season baseflow (less water stored in soil/groundwater).

Community interviews conducted:
- Sekuru Chimuti, age 81 (grandfather): "When I was young, the river ran clear all year. The musasa forest above was intact. Then people started cutting for charcoal and farming." He named specific years when sections of forest were cleared (approximately 1998, 2008, and ongoing).
- Mai Chigwedere, village pump committee chair: "Our borehole dries up every October now. Twenty years ago, it never dried." (Direct quote)
- Mr Tinashe Ruzive, Geography teacher: Confirmed hydrology principles and helped me access Zimbabwe National Statistics Agency data on rainfall trends.

Rainfall data:
ZINASA data shows average rainfall in the Nyazura area has NOT significantly decreased over 1990–2020. This is important: if rainfall is unchanged but river flow has decreased, the cause must be land use change (deforestation), not reduced rainfall.

Sacred Groves (mucha):
Research from Zimbabwe Institute of Development Studies paper (accessed school library): "Mucha forests were maintained by traditional leaders through taboos against cutting or farming. Loss of traditional authority and colonial land reorganisation in the 20th century led to widespread clearing of formerly protected areas."`,
      mafundiNote: `The rainfall data finding is a critical piece of evidence — the student has effectively eliminated climate change as the primary cause, isolating deforestation as the most likely variable. This kind of hypothesis testing through elimination is higher-order scientific thinking. The historical context of mucha degradation (colonial land reorganisation) shows the student is connecting Geography to History and cultural studies — an interdisciplinary approach that ZIMSEC's HBC explicitly encourages.`,
      keyStrengths: [
        'Rainfall data disconfirms alternative explanation — valid scientific elimination',
        'Multiple community voices including specific dates from Sekuru Chimuti',
        'Academic source (ZIDS paper) on mucha forests — shows library research skills',
        'Interdisciplinary: connects Geography to history of colonial land reorganisation',
      ],
    },
    planning: {
      content: `Mapping Plan:
Use school map + my own measurements to create a simple hand-drawn sketch map of the Nyazura catchment area (roughly 5km radius). Mark: river course, former forest areas (from oral descriptions), current tree-covered areas, cleared/farming areas.

River Measurement Plan:
Measure river water depth at one fixed point (a marked rock in the river channel) every 7 days for 8 weeks (April–June), which covers the transition from wet to dry season.
Record: depth (cm using marked stick), water clarity, and flow speed (time a leaf/float takes to travel 1 metre).

Interview Plan:
Complete semi-structured interviews with 5 community members (different ages: 20s, 40s, 60s, 80s) to build a timeline of observed changes.

Mapping tree cover change:
I do not have access to satellite images, but I will use: (1) Oral descriptions from elders to estimate former forest extent; (2) My own visual survey of remaining trees; (3) School photographs from 1980s to compare with current state.

Limitation acknowledged in advance:
Without satellite data, my maps will be approximate estimates based on oral history and observation — not precise measurements. This is a limitation I will note in my evaluation.`,
      mafundiNote: `The honesty in the planning stage — acknowledging the satellite data limitation in advance — is sophisticated. This student is not pretending to have resources they don't have; they are designing the best methodology possible within real constraints. The multi-generational interview design (different age groups: 20s, 40s, 60s, 80s) is particularly clever — it creates a 60-year timeline of community observations, which is far more valuable than any single interview.`,
      keyStrengths: [
        'Acknowledges satellite data limitation honestly in the planning stage',
        'Multi-generational interview design creates a historical timeline',
        'Low-tech but methodologically sound measurements (marked stick, leaf float time)',
        'Three sources for tree cover mapping despite no satellite access',
      ],
    },
    implementation: {
      content: `River depth measurements (8 weeks):
Week 1 (April): 34cm, clear water, moderate flow
Week 2: 31cm
Week 3: 28cm
Week 4 (May): 22cm, slightly murky
Week 5: 19cm
Week 6: 15cm
Week 7 (June): 9cm, slow flow
Week 8: 6cm — nearly dried up at measurement point

Trend: River declined 28cm in 8 weeks, or 82% of its April level. At this rate, it will dry completely by July.

Tree cover sketch map:
Based on oral descriptions and my observations, I estimate that the catchment had approximately 70% tree cover in the 1970s (Sekuru Chimuti's account) vs approximately 25–30% today. The main cleared areas are on the eastern hillside — used for tobacco farming and charcoal production.

Community interview timeline findings:
1970s: Forest intact, river flows year-round
1990s: Charcoal cutting begins, river starts failing in October
2008: Large tract cleared for tobacco farm, river now fails August–September
2020–present: River fails from July or earlier

One mucha grove (called "Mutorashanga") was mentioned by 4 of the 5 community members. It is still partially intact. The river flows strongest just below this grove, even in dry season — consistent with the hydrology principle that tree cover retains groundwater.`,
      mafundiNote: `The "Mutorashanga mucha grove" observation is the outstanding finding of this project — the student has discovered, through their own fieldwork, direct evidence that an intact sacred grove maintains stronger river flow than cleared areas. This is not just interesting; it validates the traditional Shona understanding of sacred groves as water sources. The community timeline (1970s–present) built from multi-generational interviews is methodologically creative and historically rich.`,
      keyStrengths: [
        'Quantitative decline measured (82% drop in 8 weeks) — not just "it got drier"',
        'Community timeline spans 50 years — built from multi-generational interviews',
        'Mutorashanga mucha grove observation directly validates traditional knowledge',
        'River flow pattern correlates with the grove location — genuine discovery',
      ],
    },
    evaluation: {
      content: `Summary of findings:
The data shows a clear decline in the Nyazura River from 34cm to 6cm depth over 8 weeks at the transition between wet and dry season. Combined with community oral history, which describes a 50-year progressive decline in river flow correlated with deforestation, and ZINASA rainfall data showing stable rainfall, the most parsimonious explanation is that deforestation has reduced catchment water retention capacity.

The Mutorashanga mucha grove finding is significant: this grove, maintained through traditional conservation practices, appears to be associated with stronger sustained river flow — direct evidence for the traditional Shona understanding that sacred forests "feed" rivers.

Limitations:
1. No satellite data — tree cover estimates are approximate.
2. River depth at one point may not represent whole catchment.
3. Other variables (agricultural water extraction, borehole pumping) may also affect flow and were not measured.

Heritage Conclusion:
The Shona concept of mucha was not superstition — it was a functional environmental management system. By protecting forest areas from cutting and farming through cultural taboos, traditional communities unknowingly (or knowingly) maintained the ecological services that forests provide: water regulation, soil protection, and biodiversity. The loss of mucha forests under colonial land reorganisation and post-independence pressures on land has had measurable environmental consequences.

Recommendation:
I recommend that the Nyazura Ward council, working with the traditional leader (sabhuku) and local n'anga, formally designate and protect the Mutorashanga mucha grove as a community environmental reserve. This would combine modern environmental governance with traditional land stewardship in a form that both the community and environmental authorities can support.`,
      mafundiNote: `The statement "The Shona concept of mucha was not superstition — it was a functional environmental management system" is one of the most sophisticated conclusions you will read in a Form 3 SBP. This student has genuinely synthesised their Geography fieldwork with their cultural research and arrived at an original conclusion that challenges the dismissal of traditional knowledge. The recommendation (ward council + sabhuku + n'anga working together) is specific, politically realistic, and deeply rooted in the HBC philosophy of combining modern and indigenous governance.`,
      keyStrengths: [
        '"Not superstition — a functional management system" — bold, evidence-backed original claim',
        'Connects colonial history to present environmental consequences — historical thinking',
        'Recommendation combines modern governance (ward council) with traditional (sabhuku + n\'anga)',
        'Acknowledges alternative explanations (borehole pumping) as limitations',
      ],
    },
  },
  keyLessons: [
    'Field measurements over time (weekly river depth) are more powerful than one-time observation',
    'When you can\'t access technology (satellites), use community oral history as your data source',
    'Traditional conservation practices often have scientific explanations — find the connection',
    'Your recommendation should name specific people/institutions who should act on your findings',
    'A single striking field observation (the mucha grove) can anchor an entire project conclusion',
  ],
  commonMistakes: [
    'Describing deforestation as a problem without collecting any local data to measure it',
    'Treating traditional knowledge as anecdote rather than as data',
    'Forgetting to check rainfall data — you need to rule out climate change as the cause',
    'Writing a generic conclusion about deforestation when you have specific local findings',
  ],
}

// ── Sample 5: Food & Nutrition — Fermented Foods ─────────────────────────────
const fermentedFoodsProject: SampleProject = {
  slug: 'fermented-foods-nutrition',
  title: 'Nutritional Analysis of Traditional Zimbabwean Fermented Foods and Their Role in Gut Health',
  subject: 'Food and Nutrition',
  subjectCode: 'FN',
  grade: 'Form 4',
  level: 'olevel',
  heritageTheme: 'Indigenous farming & food systems',
  summary: 'A student analyses nhopi, mahewu, and lacto-fermented vegetables from Zimbabwean cuisine, connecting traditional food preservation to modern understanding of probiotics.',
  tags: ['nutrition', 'food', 'fermentation', 'culture', 'health', 'probiotics'],
  difficulty: 'foundation',
  estimatedMarks: '72–78/100',
  stages: {
    proposal: {
      content: `In many Zimbabwean homes, fermented foods like mahewu (fermented maize drink), nhopi (fermented pumpkin/butternut), and lacto-fermented vegetables have been eaten for generations. My grandmother makes mahewu every week and says "inobatsira zvipupu" (it helps digestion). Recently I learned in Food & Nutrition class about probiotics — beneficial bacteria that support gut health. This made me think: could traditional Zimbabwean fermented foods contain probiotic bacteria?

Aims:
1. To identify and describe at least 4 traditional Zimbabwean fermented foods and their preparation methods.
2. To test the pH of each fermented food (low pH indicates active fermentation/lactic acid bacteria).
3. To compare the nutritional profile (protein, carbohydrates, fibre) of fermented vs unfermented versions of the same foods.
4. To document the traditional knowledge around these foods, including who prepares them, how the recipe is passed on, and whether young people still make them.`,
      mafundiNote: `This proposal is well structured because it connects a Food & Nutrition concept (probiotics) to a personal heritage observation (grandmother's mahewu). The Shona phrase "inobatsira zvipupu" is perfectly placed — it shows the student is listening to and recording indigenous food knowledge, not just treating grandmother as a background character. The fourth aim (documenting who makes these foods, whether young people still do) adds a cultural sustainability dimension that elevates the project above a simple chemistry test.`,
      keyStrengths: [
        'Shona phrase from grandmother immediately establishes cultural grounding',
        'Connects Food & Nutrition curriculum (probiotics) to traditional practice',
        'Aim 4 documents cultural transmission — adds heritage layer beyond the science',
        'Four foods specific to Zimbabwe — not generic "fermented foods globally"',
      ],
    },
    research: {
      content: `Foods researched and documented:
1. Mahewu: Maize porridge (sadza) fermented for 1–3 days. Sour taste indicates lactic acid fermentation. Traditionally given to children and nursing mothers.
2. Nhopi: Pumpkin/butternut mash, sometimes fermented before drying. Rich in beta-carotene (Vitamin A precursor).
3. Lacto-fermented vegetables (muriwo wakaora): Leafy vegetables (chomolia, rape) fermented in salted water for 2–5 days.
4. Dovi with fermentation: Some traditional peanut butter preparations involved partial fermentation, enhancing digestibility.

Nutritional science:
Fermentation increases the bioavailability of nutrients — meaning more vitamins and minerals are available for absorption than in the unfermented food. Lactic acid bacteria (LAB) produce lactic acid, lowering pH. They also produce B vitamins and enhance the digestibility of proteins. According to the World Health Organisation, fermented foods are associated with improved gut microbiome diversity and immune function.

Traditional knowledge interviews (with grandmother Ambuya VaChigamba and her neighbour Mai Marufu):
Both women make mahewu regularly. Ambuya VaChigamba: "We were taught that mahewu must ferment until it smells right — not too sour, not flat. Your nose tells you when it is ready." This sensory-based quality control is a traditional form of food science.

Concern about loss of knowledge: "My children do not make mahewu anymore. They buy Chibuku from the shop. The recipe is in my head, not written anywhere."`,
      mafundiNote: `The "sensory-based quality control" observation — where the grandmother uses smell to judge fermentation readiness — is an excellent connection between traditional and scientific knowledge. This is exactly the kind of insight that earns marks in HBC projects. Notice that the student names both interviewees and gives their exact quotes. The concern about knowledge loss ("in my head, not written anywhere") creates urgency that will strengthen the conclusion.`,
      keyStrengths: [
        'Four specific Zimbabwean foods — each described in cultural context',
        '"Your nose tells you when it is ready" — traditional quality control = sensory science',
        'WHO reference adds scientific authority without dismissing traditional knowledge',
        'Knowledge loss concern from Ambuya VaChigamba sets up a strong conclusion',
      ],
    },
    planning: {
      content: `Materials:
- Fresh mahewu (home-made by grandmother — same batch)
- Store-bought mahewu (Chibuku or similar) for comparison
- Unfermented maize porridge (sadza)
- Home-made lacto-fermented vegetables (muriwo wakaora) vs fresh vegetables
- pH paper (wide range 1–14 and narrow range 4–7) — from school laboratory
- Iodine solution (starch test for carbohydrates)
- Biuret reagent (if available) for protein test

Tests planned:
1. pH test: Test pH of fermented vs unfermented versions of same foods
2. Starch test: Iodine on fermented vs unfermented mahewu — does fermentation reduce starch?
3. Protein test: Biuret test on mahewu and muriwo wakaora
4. Taste/sensory test (with family members): Rate sour, sweet, salty on scale 1–5 for each food
5. Visual observation: Observe and describe appearance (colour, texture, bubbles/activity)`,
      mafundiNote: `Including a sensory evaluation test (taste rating with family) alongside the chemical tests is creative and appropriate for a Food & Nutrition project. It acknowledges that food quality is not only about chemistry but also about human experience. The comparison between home-made mahewu and shop-bought Chibuku is a smart design choice — it will reveal whether industrial production preserves the same qualities as traditional preparation.`,
      keyStrengths: [
        'Sensory evaluation test included — appropriate for Food & Nutrition subject',
        'Home-made vs shop-bought comparison is a clever experimental design',
        'pH narrow range paper selected — shows understanding of expected pH values',
        'Notes if Biuret reagent is unavailable — honest planning',
      ],
    },
    implementation: {
      content: `pH Results:
- Home-made mahewu (3 days): pH 3.5 (strongly acidic) ✓ indicates active LAB fermentation
- Store-bought Chibuku: pH 4.0 (moderately acidic)
- Fresh maize porridge (unfermented): pH 6.8 (near neutral)
- Lacto-fermented vegetables (4 days): pH 3.8
- Fresh vegetables (unfermented): pH 6.2

Starch test:
- Fresh porridge: Deep blue-black with iodine = high starch present
- Home-made mahewu: Very pale blue = significantly less starch (bacteria have consumed it)
- Conclusion: Fermentation significantly reduces starch content — converts starch to lactic acid

Protein test:
- Home-made mahewu: Positive biuret result — protein present
- Both fermented and unfermented had protein — fermentation did not significantly reduce protein.

Sensory evaluation (5 family members):
Home-made mahewu rated significantly higher for taste satisfaction (avg 4.2/5) than Chibuku (avg 2.8/5). Family noted home-made was "thicker" and had a "cleaner" sour taste. Ambuya VaChigamba's version was consistently preferred.

Observation:
I noticed bubbles on the surface of freshly fermenting mahewu — this is CO2 produced by yeast fermentation. This explains why fermenting vessels should not be tightly sealed.`,
      mafundiNote: `The starch test finding is the standout chemical result — showing visually (blue-black to pale) that fermentation transforms starch into lactic acid. This directly connects the chemistry to the traditional knowledge: when mahewu loses its starchiness and becomes sour, the bacteria have done their work — exactly what Ambuya VaChigamba describes when she says "your nose tells you when it is ready." The CO2 bubble observation shows the student is observing actively, not just testing.`,
      keyStrengths: [
        'pH data is specific and shows clear pattern across all foods',
        'Iodine test shows visual transformation from starch to acid — powerful evidence',
        'Sensory panel includes grandmother as participant — closes the cultural loop',
        'CO2 bubble observation shows active scientific curiosity',
      ],
    },
    evaluation: {
      content: `Conclusions:
1. Traditional Zimbabwean fermented foods (mahewu, muriwo wakaora) show pH levels (3.5–3.8) consistent with active lactic acid bacterial fermentation, confirming the presence of probiotic-type organisms.
2. Home-made mahewu shows significantly more fermentation activity (lower pH, less residual starch) than industrial Chibuku, suggesting traditional methods may produce more nutritional benefit.
3. The sensory evaluation confirmed family preference for home-made versions — showing that traditional preparation preserves taste qualities that industrial production loses.
4. My grandmother's assessment that mahewu "inobatsira zvipupu" (helps digestion) is supported by the science: lactic acid bacteria and their metabolites are well-documented for gut health benefits.

Limitations:
Lab tests were qualitative (positive/negative) rather than quantitative. I could not measure exact probiotic counts or specific vitamin levels without advanced equipment. This is a significant limitation.

Heritage Reflection:
This project confirmed that traditional Zimbabwean food preservation (fermentation) is not just cultural practice — it is effective nutritional science. The women who developed and maintained these practices did so without formal chemistry training, but through generations of observation and experimentation, they identified which foods and which processes produced the healthiest, best-tasting outcomes. This is indigenous scientific knowledge.

Recommendation:
Food & Nutrition and Home Economics teachers should incorporate traditional Zimbabwean fermented foods into their curriculum. Schools should run practical sessions where students make mahewu and lacto-fermented vegetables under guidance from community elders, preserving both the recipe knowledge and the scientific understanding of fermentation.`,
      mafundiNote: `The line "My grandmother's assessment is supported by the science" perfectly closes the arc of this project. The student started with grandmother's observation and ends by validating it with evidence — this is the best possible structure for a HBC project. The heritage reflection paragraph elevates the conclusion: recognising that traditional food preservation represents "generations of observation and experimentation" is to correctly characterise indigenous knowledge as a form of science, which is core to the HBC philosophy.`,
      keyStrengths: [
        '"inobatsira zvipupu" validated by science — perfect closing of the narrative arc',
        'Honest about quantitative limitations — accepts what the tests could and couldn\'t prove',
        '"Indigenous scientific knowledge" framing is exactly right for HBC',
        'Practical school recommendation is specific and implementable',
      ],
    },
  },
  keyLessons: [
    'A sensory evaluation (taste, smell, texture rating) is valid data for Food & Nutrition projects',
    'Compare traditional preparation vs commercial/modern version — the difference is often the finding',
    'Name your interviewees — "my grandmother Ambuya VaChigamba" is much stronger than "an elder"',
    'Your conclusion should validate or challenge a traditional belief with evidence',
    'Heritage reflection should frame traditional practice as a form of science, not superstition',
  ],
  commonMistakes: [
    'Describing the foods without testing them — the practical tests are what make it a science project',
    'Only interviewing young people — for traditional food knowledge, interview the oldest family members',
    'Not comparing fermented to unfermented versions — the comparison is the whole point',
    'Concluding "traditional food is healthy" without the data to back it up',
  ],
}

// ── Sample 6: Computer Science / Innovation — Local Market Tech ───────────────
const marketTechProject: SampleProject = {
  slug: 'market-price-sms-system',
  title: 'Designing a Paper-Based Prototype for an SMS Price-Comparison System for Mbare Musika Vendors',
  subject: 'Computer Science',
  subjectCode: 'CS',
  grade: 'Form 4',
  level: 'olevel',
  heritageTheme: 'Entrepreneurship & local economy',
  summary: 'A student designs and paper-prototypes an SMS-based price system for informal market vendors, solving a real market information problem without requiring smartphones.',
  tags: ['technology', 'market', 'SMS', 'innovation', 'entrepreneurship', 'Harare'],
  difficulty: 'intermediate',
  estimatedMarks: '73–80/100',
  stages: {
    proposal: {
      content: `Every Saturday morning, my mother drives 45 minutes to Mbare Musika to buy vegetables and fruit wholesale. Sometimes she arrives to find that tomatoes cost twice as much as the previous week, and she has no way of knowing the price before she travels. Other times, she misses a good price because she bought elsewhere. I have also observed that vendors at the market cannot easily compare prices with sellers in other sections.

Zimbabwe's informal market — Mbare Musika, Gweru market, Masvingo Mucheke — is the engine of food distribution for millions of people. Yet buyers and sellers operate with very limited price information.

My idea: An SMS-based price notification system. A market manager sends weekly price updates to a central number via SMS. The system stores these and sends a digest to subscribers. Crucially, it works on basic phones — no smartphone or internet required.

Aims:
1. To understand the current price information problem by surveying market vendors and buyers.
2. To design a system (inputs, process, outputs) for SMS-based price updates.
3. To create a paper prototype of the user interface and message format.
4. To evaluate the feasibility of the system with vendors and buyers.

Significance: This addresses a real economic problem facing informal traders — who form 60% of Zimbabwe's workforce (ZIMSTAT 2022). It connects Zimbabwe's vibrant informal economy (a form of ubuntu entrepreneurship) with appropriate technology.`,
      mafundiNote: `The problem identification is exceptionally strong here — specific (45-minute drive, tomatoes doubling in price), personal, and connected to a national-scale issue (informal markets, 60% of workforce). Critically, the student has identified a TECHNOLOGY CONSTRAINT that makes the solution non-obvious: it must work on basic phones, not smartphones. This constraint makes the design problem more interesting and the solution more relevant to Zimbabwe's actual technology landscape. Citing ZIMSTAT shows research has begun before the formal research stage.`,
      keyStrengths: [
        'Specific, personal problem with measurable impact (45-minute drive wasted)',
        'Identifies basic phone constraint — shows understanding of Zimbabwe\'s tech landscape',
        'ZIMSTAT statistic in the proposal — research consciousness from the start',
        '"Ubuntu entrepreneurship" — frames informal economy in heritage terms',
      ],
    },
    research: {
      content: `Survey conducted: I surveyed 15 vendors and 10 buyers at Mbare Musika over two Saturdays.

Key findings:
- 87% of vendors have a mobile phone; only 13% have a smartphone.
- 73% of buyers said they have lost money traveling to market only to find prices were unfavourable.
- 93% of vendors said they would use a free SMS price update system if available.
- Average vendor earns: USD $12–18/day (estimated from survey)

SMS technology research:
SMS (Short Message Service) works on any mobile network on basic phones. Zimbabwe has three providers: Econet, NetOne, Telecel. All support bulk SMS services. EcoFarmer (an Econet service) already uses SMS to send farming information to rural farmers — proving the concept works in Zimbabwe.

System design theory (Computing textbook):
An information system has: Inputs → Process → Storage → Outputs. For this project:
- Input: Market manager sends price data via SMS to a central number
- Process: Messages are logged (stored in a register book or simple database)
- Storage: A physical or digital price register
- Output: Weekly SMS digest sent to subscribers

Interview with Mr Tapiwa Chinyanga, Mbare Musika vendor (tomatoes and spinach): "If I could send my prices to buyers before they travel, I would get more customers. Right now, buyers don't know who has the best price until they walk around the whole market."

Interview with Mrs Ruth Machaka, regular buyer: "I would absolutely subscribe to a service like this. Even $0.20 per week for accurate price information would save me much more in travel costs."`,
      mafundiNote: `The survey data is the backbone of this project. 15 vendors + 10 buyers surveyed is a respectable sample for a Form 4 student working independently. The key finding to highlight is: 87% have mobile phones but only 13% have smartphones — this single data point justifies the entire design choice (SMS not app). The EcoFarmer example is perfect secondary research because it proves the concept already works in Zimbabwe. The willingness-to-pay finding ($0.20/week for Mrs Machaka) is sophisticated economic thinking.`,
      keyStrengths: [
        '25 people surveyed — respectable primary research sample',
        '87%/13% mobile vs smartphone finding validates SMS design choice',
        'EcoFarmer reference — existing Zimbabwe SMS precedent',
        'Willingness-to-pay finding ($0.20/week) shows economic viability thinking',
        'Two specific named interviewees with direct quotes',
      ],
    },
    planning: {
      content: `System design (paper prototype):

Message format designed:
MBARE PRICES [DATE]
TOMATOES: $0.80/kg (↑ from $0.65)
SPINACH: $0.40/bunch (stable)
ONIONS: $1.20/kg (↓ from $1.50)
Reply STOP to unsubscribe. Reply SUB to subscribe.

Data collection design:
- Market manager fills in a paper "Price Report Card" each Friday morning
- Manager sends one SMS per product category to central number
- A volunteer (could be a student) compiles the week's prices and sends the digest

User interface sketches (paper prototype):
I designed on paper:
1. The Price Report Card (for vendors/managers to fill in)
2. The subscriber registration form (for buyers to sign up)
3. The weekly digest message format
4. A flow diagram showing how information moves from market to buyer

Feasibility questions to test:
1. Can a market manager realistically send 5–8 SMS messages every Friday?
2. Would the market committee support this system?
3. What would the SMS sending cost be? (Econet bulk SMS rate: ~$0.02 per message)`,
      mafundiNote: `Paper prototyping is a legitimate professional design technique — this student is applying real systems design methodology. The message format (showing price changes with arrows ↑ ↓) is cleverly designed for information density in 160 characters. The cost calculation ($0.02 per SMS) shows financial sustainability thinking. Designing a PROCESS for data collection (the Price Report Card) shows the student understands that technology solutions require human processes to work.`,
      keyStrengths: [
        'Paper prototype shown — legitimate design methodology, not just description',
        'Message format uses 160-character SMS constraint intelligently',
        'Price Report Card design shows understanding that systems need human processes',
        'SMS cost calculated ($0.02) — feasibility thinking',
        'Flow diagram planned — systems thinking visually expressed',
      ],
    },
    implementation: {
      content: `I presented my paper prototype to 8 stakeholders at Mbare Musika: 5 vendors, 2 buyers, and 1 market committee member.

Feedback received:

Positive feedback:
- All 8 stakeholders said the concept was useful and would benefit them
- Market committee member (Mr A. Mawere) said the market committee would consider supporting such a system officially: "We have been thinking about how to modernise without losing the community feel of Mbare"
- 7 of 8 said they would subscribe to receive price SMS messages

Issues identified:
- Vendors raised a concern: "What if a vendor sends a false low price to attract customers, then changes it when they arrive?" — This is a data integrity problem I had not considered.
- One buyer asked: "What about vendors who don't have mobile phones?" — 13% of vendors in my survey.
- A vendor suggested prices should be in both USD and ZiG (Zimbabwe Gold) because prices change depending on which currency customers use.

Prototype revisions based on feedback:
- Added a "verification" concept: prices submitted should be from the market manager, not individual vendors, to ensure accuracy
- Added ZiG/USD dual currency to the message format
- Added a note that prices could also be posted on a board at the market entrance for those without phones`,
      mafundiNote: `The stakeholder presentation is excellent professional practice — the student built the prototype, tested it with real people, and iterated based on feedback. The data integrity issue (fake prices) is a problem the student had not considered and was raised by a vendor — this shows that real community engagement reveals problems that desk design misses. The ZiG/USD currency suggestion from a vendor shows this student is embedded in the real economic conditions of Zimbabwe in 2025. Incorporating this feedback into the revised prototype shows genuine responsiveness.`,
      keyStrengths: [
        'Stakeholder testing session is professional design practice',
        'Data integrity problem raised by vendor — real community engagement finding',
        'ZiG/USD dual currency — shows current Zimbabwe economic awareness (2025)',
        'Non-phone option (market notice board) shows inclusive design thinking',
        'Revised prototype based on feedback — shows iterative design process',
      ],
    },
    evaluation: {
      content: `This project designed, prototyped, and validated a concept for an SMS price notification system for informal market buyers and sellers. All 8 stakeholders consulted agreed the concept addressed a real need. The market committee member expressed openness to official support.

Did the system design meet the aims?
1. Problem understood: ✓ Survey and interviews confirmed the price information gap
2. System designed: ✓ Complete input-process-output model designed
3. Paper prototype: ✓ Message format, report card, subscriber form, and flow diagram created
4. Feasibility evaluated: ✓ Feedback identified both strengths and real problems (data integrity, currency, no-phone access)

What the project does NOT do:
This is a design project, not a built system. I did not write any code. The system was not actually implemented. This is an important limitation — a paper prototype and stakeholder validation is not proof that the system would work at scale.

Heritage and Economic Significance:
Mbare Musika is one of Zimbabwe's most important cultural and economic institutions. It has operated since colonial times and has survived economic crises, currency changes, and political upheavals because of its community-based resilience. The spirit of ubuntu — "I am because we are" — is embedded in how vendors share spaces, cooperate, and support one another. This project tried to extend that cooperative spirit by helping information flow as freely between vendors and buyers as the goods themselves.

Recommendation:
I recommend that the Harare City Council, in partnership with Econet Wireless and a local university computer science department, pilot this SMS price notification system at Mbare Musika for 6 months. The concept has been validated; the next step is implementation.`,
      mafundiNote: `The self-awareness in this evaluation — "This is a design project, not a built system" — is rare and valuable. The student correctly identifies the boundary of what was achieved and what remains to be done. This is more impressive than overclaiming. The heritage reflection on Mbare Musika's history (colonial times, economic crises, ubuntu spirit) shows extraordinary cultural understanding for a Form 4 student. The partnership recommendation (City Council + Econet + university) is realistic and sophisticated.`,
      keyStrengths: [
        'Honestly states "I did not write any code" — no overclaiming',
        'Mbare Musika historical context (colonial era, ubuntu spirit) shows cultural depth',
        'Multi-partner recommendation (City Council + Econet + university) is realistic',
        'Structured self-assessment using aims checklist ✓ — shows organised thinking',
      ],
    },
  },
  keyLessons: [
    'Survey real users before designing — the 87%/13% phone data justified the entire design',
    'Paper prototyping is legitimate engineering — you don\'t need to build code to do a CS SBP',
    'Test your design with real stakeholders — they will find problems you never thought of',
    'Be honest about what your project is and isn\'t — markers respect honesty about scope',
    'Connect your technology solution to Zimbabwean cultural and economic context',
  ],
  commonMistakes: [
    'Designing for smartphones when most users in Zimbabwe have basic phones',
    'Describing an app concept without any design drawings, message formats, or flow diagrams',
    'Not testing the prototype with real users — desk design without community validation',
    'Ignoring currency (ZiG vs USD) in any Zimbabwe economics or business project',
  ],
}

// ── Export all sample projects ────────────────────────────────────────────────
export const SAMPLE_PROJECTS: SampleProject[] = [
  irrigationProject,
  solarHeaterProject,
  medicinalPlantsProject,
  watershedProject,
  fermentedFoodsProject,
  marketTechProject,
]

export function getSampleProject(slug: string): SampleProject | undefined {
  return SAMPLE_PROJECTS.find(p => p.slug === slug)
}

export const SUBJECT_FILTER_OPTIONS = Array.from(new Set(SAMPLE_PROJECTS.map(p => p.subject))).sort()
export const GRADE_FILTER_OPTIONS = Array.from(new Set(SAMPLE_PROJECTS.map(p => p.grade))).sort()
