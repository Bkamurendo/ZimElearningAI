/**
 * ZIMSEC-aligned course and lesson content for ZimLearn.
 * Covers Primary, O-Level and A-Level subjects.
 *
 * Each course: { subjectCode, title, description, lessons[] }
 * Each lesson:  { title, type: 'text'|'video'|'pdf', content }
 */

type Lesson = { title: string; type: 'text' | 'video' | 'pdf'; content: string }
type Course = { subjectCode: string; title: string; description: string; lessons: Lesson[] }

// ══════════════════════════════════════════════════════════
// PRIMARY MATHEMATICS
// ══════════════════════════════════════════════════════════

const primaryMath: Course = {
  subjectCode: 'PRI-MATH',
  title: 'Primary Mathematics — Numbers, Operations & Fractions',
  description: 'Covers number sense, the four operations, fractions, decimals and percentages aligned with the ZIMSEC Primary Mathematics syllabus for Grades 3–7.',
  lessons: [
    {
      title: 'Place Value and the Number System',
      type: 'text',
      content: `# Place Value and the Number System

## What is Place Value?
Every digit in a number has a **place** and a **value** based on that place.

| Place | Value |
|-------|-------|
| Ones | 1 |
| Tens | 10 |
| Hundreds | 100 |
| Thousands | 1 000 |
| Ten-thousands | 10 000 |
| Hundred-thousands | 100 000 |
| Millions | 1 000 000 |

### Example — 3 456 027
- 3 → millions → 3 000 000
- 4 → hundred-thousands → 400 000
- 5 → ten-thousands → 50 000
- 6 → thousands → 6 000
- 0 → hundreds → 0
- 2 → tens → 20
- 7 → ones → 7

**Expanded notation:** 3 000 000 + 400 000 + 50 000 + 6 000 + 20 + 7

## Comparing Numbers
Start from the leftmost (highest) place value. Compare 47 823 and 47 519:
- Both: 4 ten-thousands, 7 thousands
- Hundreds: 8 > 5, so **47 823 > 47 519**

## Activity
1. Write 2 508 734 in expanded notation.
2. What is the value of the digit 6 in 1 635 200?
3. Arrange in descending order: 98 401; 98 041; 98 410`,
    },
    {
      title: 'The Four Operations — Addition, Subtraction, Multiplication and Division',
      type: 'text',
      content: `# The Four Operations

## Addition (Column Method)
Always line up digits by place value.

**Example:** 45 678 + 23 954 = **69 632**

Steps (right to left):
- Ones: 8 + 4 = 12 → write 2, carry 1
- Tens: 7 + 5 + 1 = 13 → write 3, carry 1
- Hundreds: 6 + 9 + 1 = 16 → write 6, carry 1
- Thousands: 5 + 3 + 1 = 9; Ten-thousands: 4 + 2 = 6

## Subtraction (Borrowing/Regrouping)
Work right to left; borrow from the next column when needed.

**Example:** 8 500 − 3 275 = **5 225**

## Multiplication — Long Method
**Example:** 346 × 28
- 346 × 8 = 2 768
- 346 × 20 = 6 920
- Total = **9 688**

### Multiplying by 10/100/1000
- × 10 → add one zero
- × 100 → add two zeros
- × 1 000 → add three zeros

## Division
**Short division example:** 2 856 ÷ 6 = **476**

**Interpreting remainders:** 47 children, minibuses hold 12 → 47 ÷ 12 = 3 r 11 → need **4 minibuses**

## Divisibility Rules
| Divisible by | Rule |
|---|---|
| 2 | Last digit is even |
| 3 | Digit sum divisible by 3 |
| 5 | Last digit 0 or 5 |
| 10 | Last digit 0 |`,
    },
    {
      title: 'Fractions — Concepts and Operations',
      type: 'text',
      content: `# Fractions

## What is a Fraction?
A fraction represents **part of a whole**. It has a **numerator** (top) and **denominator** (bottom).
¾ means 3 parts out of 4 equal parts.

## Equivalent Fractions
Multiply numerator and denominator by the same number:
½ = 2/4 = 3/6 = 4/8 (all equal!)

## Adding Fractions
**Same denominator:** ¼ + 2/4 = 3/4

**Different denominators — find LCM first:**
½ + ⅓ → LCM of 2 and 3 = 6 → 3/6 + 2/6 = **5/6**

## Subtracting Fractions
5/6 − ¼ → LCM = 12 → 10/12 − 3/12 = **7/12**

## Multiplying Fractions
Multiply numerators together, denominators together:
¾ × 2/5 = 6/20 = **3/10**

## Dividing Fractions
"Keep, Change, Flip" — multiply by the reciprocal:
¾ ÷ ½ = ¾ × 2/1 = **6/4 = 1½**

## Mixed Numbers and Improper Fractions
Mixed: 2¾ → Improper: 11/4 (multiply whole by denominator, add numerator)
Improper: 17/5 → Mixed: 3 2/5`,
    },
    {
      title: 'Decimals',
      type: 'text',
      content: `# Decimals

## Decimal Place Value
| Position | Value |
|----------|-------|
| Tenths | 0.1 |
| Hundredths | 0.01 |
| Thousandths | 0.001 |

**Example:** 3.456
- 3 ones, 4 tenths, 5 hundredths, 6 thousandths

## Converting Fractions to Decimals
Divide numerator by denominator:
- ½ = 1 ÷ 2 = **0.5**
- ¾ = 3 ÷ 4 = **0.75**
- 1/3 = 1 ÷ 3 = **0.333...** (recurring)

## Adding and Subtracting Decimals
Line up the decimal points!

**Example:** 3.45 + 1.7
\`\`\`
  3.45
+ 1.70
------
  5.15
\`\`\`

## Multiplying Decimals
Ignore the decimal, multiply, then place decimal back:
2.3 × 1.4 → 23 × 14 = 322 → 2 decimal places → **3.22**

## Rounding Decimals
Look at the next digit:
- 5 or more → round up
- Less than 5 → round down

3.476 rounded to 2 decimal places = **3.48**`,
    },
    {
      title: 'Percentages',
      type: 'text',
      content: `# Percentages

## What is a Percentage?
**Per cent** means "out of 100". The symbol is **%**.

## Converting: Fractions, Decimals, Percentages

| Fraction | Decimal | Percentage |
|----------|---------|------------|
| 1/2 | 0.5 | 50% |
| 1/4 | 0.25 | 25% |
| 3/4 | 0.75 | 75% |
| 1/5 | 0.2 | 20% |
| 1/10 | 0.1 | 10% |
| 1/3 | 0.333 | 33.3% |

**Fraction → %:** Multiply by 100
¾ × 100 = **75%**

**% → Decimal:** Divide by 100
35% = 0.35

## Finding a Percentage of an Amount
**Example:** 30% of $450
= 30/100 × 450 = **$135**

**Short method:** 10% of 450 = 45; 30% = 3 × 45 = **$135**

## Percentage Increase/Decrease
% increase = (increase ÷ original) × 100

**Example:** Price rises from $200 to $240
Increase = $40
% increase = 40/200 × 100 = **20%**

## Discount
**Example:** 15% off $80
Discount = 15/100 × 80 = $12
New price = 80 − 12 = **$68**`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// PRIMARY ENGLISH
// ══════════════════════════════════════════════════════════

const primaryEnglish: Course = {
  subjectCode: 'PRI-ENG',
  title: 'Primary English — Reading, Writing & Grammar',
  description: 'Develops reading comprehension, creative writing, grammar and vocabulary for ZIMSEC Primary English Grades 3–7.',
  lessons: [
    {
      title: 'Reading Comprehension Strategies',
      type: 'text',
      content: `# Reading Comprehension Strategies

## Before You Read
1. Read the **title** — what might this be about?
2. Read all **questions** first — know what to look for
3. Note source/type of text

## Types of Questions

### Literal (answer is IN the text)
"According to the passage, what time did the train arrive?"
→ Find the exact information; use your own words.

### Inferential (read between the lines)
"Why do you think the character felt nervous?"
→ Use clues; write: "This suggests that..." / "The writer implies..."

### Vocabulary Questions
"What does the word 'exhausted' mean in line 14?"
→ Look at surrounding words for context clues.

## Sample Practice Passage

> **The Baobab Tree**
> The baobab is one of Africa's most remarkable trees. It can live for over 2 000 years and store thousands of litres of water in its massive trunk. Local communities use its fruit, bark and leaves for food and medicine. Many people call it the "Tree of Life."

**Questions:**
1. How long can a baobab live? *(Literal)*
2. Why do people call it the "Tree of Life"? *(Inferential)*
3. What does "remarkable" mean in context? *(Vocabulary)*

## Top Tips
- Read the questions **before** the passage
- Use **evidence** from the text in every answer
- Write in **complete sentences**
- Don't copy large chunks — use your own words`,
    },
    {
      title: 'Parts of Speech',
      type: 'text',
      content: `# Parts of Speech

## 1. Nouns — naming words
- **Common:** dog, river, book, city
- **Proper (capital letter):** Harare, Zimbabwe, Chipo
- **Collective:** a *herd* of cattle, a *flock* of birds, a *class* of pupils

## 2. Pronouns — replace nouns
I, you, he, she, it, we, they, me, him, her, us, them

*"Chipo went to school. **She** arrived early."*

## 3. Verbs — action or being words
- **Action:** run, eat, write, jump
- **State (being):** is, are, was, were, seem, feel

## 4. Adjectives — describe nouns
Size, colour, shape, number, opinion:
*"The **tall, old** baobab stands in the **dry** field."*

## 5. Adverbs — describe verbs, adjectives, or other adverbs
Often end in **-ly**:
*"She ran **quickly**. He spoke **very** softly."*

## 6. Prepositions — show position or time
in, on, under, behind, between, through, after, before:
*"The cat sat **under** the table."*

## 7. Conjunctions — joining words
**FANBOYS:** For, And, Nor, But, Or, Yet, So
*"I wanted to play **but** it was raining."*

## Quick Practice
Identify the part of speech of each underlined word:
1. The **clever** students passed their exams.
2. Farai ran **swiftly** to the bus stop.
3. Mum cooked sadza **and** stew.`,
    },
    {
      title: 'Sentence Structure and Punctuation',
      type: 'text',
      content: `# Sentence Structure and Punctuation

## Types of Sentences

### Simple Sentence
One subject + one verb:
*"The dog barked."* | *"Sasha reads every day."*

### Compound Sentence
Two main clauses + conjunction (and, but, or, so):
*"The dog barked **and** the cat ran away."*

### Complex Sentence
Main clause + subordinate clause (because, when, although, if):
*"Although it was raining, we went to school."*

## Essential Punctuation

| Mark | Name | Use | Example |
|------|------|-----|---------|
| . | Full stop | End of statement | *She reads daily.* |
| ? | Question mark | End of question | *Is it raining?* |
| ! | Exclamation mark | Strong feeling | *What a goal!* |
| , | Comma | Pause, lists | *apples, bananas, and mangoes* |
| ' | Apostrophe | Possession or contraction | *Tendai's book; don't* |
| " " | Speech marks | Direct speech | *"Come here," she said.* |

## Apostrophes
**Possession:** Tendai**'s** bag | The children**'s** playground
**Contraction:** do not → don**'t** | I am → I**'m** | it is → it**'s**

## Direct Speech Rules
1. Put speech in **"quotation marks"**
2. Punctuation goes **inside** the closing mark
3. New speaker → **new line**
4. Capital letter at start of speech

*Farai said, **"I will help you with your homework."***`,
    },
    {
      title: 'Creative and Narrative Writing',
      type: 'text',
      content: `# Creative Writing

## Story Structure

| Part | Purpose |
|------|---------|
| **Beginning** | Introduce setting + characters; create atmosphere |
| **Middle** | Introduce a problem or conflict; build tension |
| **End** | Resolve the problem; show what character learned |

## Planning with a Story Map
Before writing, plan these five things:
1. **Setting** — where and when?
2. **Characters** — who are they?
3. **Problem** — what goes wrong?
4. **Events** — three key things that happen
5. **Resolution** — how is it solved?

## Writing Techniques

### Show, Don't Tell
❌ *She was scared.*
✅ *Her hands trembled and her heart hammered against her ribs.*

### Vary Your Sentence Starters
- *Suddenly, a loud noise...*
- *Without warning, the door burst open...*
- *Clutching her bag tightly, she crept forward...*

### The 5 Senses
Use sight, sound, smell, taste and touch to make your writing vivid.

## Powerful Story Openings
- **In the action:** *"Run!" Farai screamed, already halfway across the field.*
- **Vivid description:** *The drought had lasted three seasons. The earth cracked like old pottery.*
- **Mystery:** *My grandmother kept a secret for sixty years.*

## Before You Submit — Checklist
- [ ] Clear beginning, middle and end?
- [ ] Descriptive adjectives and adverbs used?
- [ ] Some dialogue included?
- [ ] Varied sentence starters?
- [ ] Spelling and punctuation checked?`,
    },
    {
      title: 'Spelling Rules and Vocabulary',
      type: 'text',
      content: `# Spelling Rules and Vocabulary

## Common Spelling Rules

### i before e, except after c
believe, receive, achieve, ceiling, perceive
*Exceptions:* weird, seize, either, neighbour

### Drop the silent 'e' before -ing or -ed
make → making | hope → hoping | dance → dancing

### Double the final consonant (short vowel + single consonant)
run → running | stop → stopped | begin → beginning

### Plurals
- Most words: add **-s** (cat → cats)
- Ending s, x, z, ch, sh: add **-es** (bus → buses)
- Consonant + y: change y to **-ies** (baby → babies)
- Vowel + y: add **-s** (day → days)

## Commonly Confused Words

| Word | Meaning |
|------|---------|
| their | belonging to them |
| there | a place |
| they're | they are |
| your | belonging to you |
| you're | you are |
| its | belonging to it |
| it's | it is |
| to | direction/infinitive |
| too | also/excessively |
| two | the number 2 |

## Word Families (one root → many words)
- **act** → action, active, react, actor, enact
- **help** → helpful, helpless, helper, helping
- **beauty** → beautiful, beautify, beautifully

## Strong Vocabulary for Writing
Instead of **said**: stated, replied, insisted, whispered, exclaimed, argued
Instead of **good**: excellent, outstanding, remarkable, exceptional
Instead of **big**: enormous, vast, immense, colossal`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// O-LEVEL MATHEMATICS
// ══════════════════════════════════════════════════════════

const olevelMathAlgebra: Course = {
  subjectCode: 'OL-MATH',
  title: 'O-Level Mathematics — Algebra and Functions',
  description: 'Covers algebraic expressions, equations, functions, indices and variation for ZIMSEC O-Level Mathematics.',
  lessons: [
    {
      title: 'Algebraic Expressions — Simplification and Expansion',
      type: 'text',
      content: `# Algebraic Expressions

## Key Terms
- **Variable:** a letter representing an unknown (x, y, n)
- **Term:** number, variable, or product of both (5x, −3y², 7)
- **Expression:** terms connected by + or − (3x + 2y − 5)
- **Coefficient:** the number multiplying a variable

## Collecting Like Terms
Like terms have the **same variable and power**.

5x² − 3x + 2x² + 7x − 4 = **(5+2)x² + (−3+7)x − 4 = 7x² + 4x − 4**

## Expanding Brackets
**Single:** a(b + c) = ab + ac → 3(2x − 5) = **6x − 15**

**Double (FOIL):** (x + 3)(x − 2)
= x² − 2x + 3x − 6 = **x² + x − 6**

**Difference of squares:** (a + b)(a − b) = **a² − b²**
Example: (x + 5)(x − 5) = **x² − 25**

**Perfect square:** (a + b)² = **a² + 2ab + b²**
Example: (x + 4)² = **x² + 8x + 16**

## Factorising
Reverse of expanding.

**Common factor:** 6x + 10 = **2(3x + 5)**

**Trinomial:** x² + 5x + 6 = **(x + 2)(x + 3)**
→ Find two numbers: multiply to +6, add to +5 → 2 and 3

**Difference of squares:** x² − 9 = **(x + 3)(x − 3)**

## Practice
1. Simplify: 4a² + 3a − 2a² + a − 5
2. Expand: (2x − 3)(x + 5)
3. Factorise: x² − x − 12
4. Factorise fully: 4x² − 16`,
    },
    {
      title: 'Linear and Simultaneous Equations',
      type: 'text',
      content: `# Linear and Simultaneous Equations

## Solving Linear Equations
**Goal:** isolate the variable.

**Example 1:** 3x − 7 = 14 → 3x = 21 → **x = 7**

**Example 2:** 2(x + 4) = 3x − 1
2x + 8 = 3x − 1 → **x = 9**

**Fractions:** x/3 + x/4 = 7 → multiply by 12 → 4x + 3x = 84 → **x = 12**

## Simultaneous Equations

### Substitution
y = 2x − 1 and 3x + y = 14:
3x + (2x − 1) = 14 → 5x = 15 → **x = 3, y = 5**

### Elimination
3x + 2y = 12 and 5x − 2y = 4:
Add: 8x = 16 → **x = 2**; then y = 3

## Linear Inequalities
Treat like an equation, but **flip the sign when multiplying/dividing by negative**.

−2x + 3 > 7 → −2x > 4 → **x < −2**

On a number line:
- Open circle ○ for < or >
- Closed circle ● for ≤ or ≥`,
    },
    {
      title: 'Quadratic Equations',
      type: 'text',
      content: `# Quadratic Equations

Standard form: **ax² + bx + c = 0** (a ≠ 0)

## Method 1 — Factorisation
x² + 5x + 6 = 0 → (x + 2)(x + 3) = 0 → **x = −2 or x = −3**

## Method 2 — Completing the Square
x² + 6x − 7 = 0:
(x + 3)² − 9 − 7 = 0 → (x + 3)² = 16 → x + 3 = ±4
**x = 1 or x = −7**

## Method 3 — Quadratic Formula
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

**Example:** 3x² − 5x − 2 = 0 (a=3, b=−5, c=−2)
x = (5 ± √(25 + 24)) / 6 = (5 ± 7)/6
**x = 2 or x = −⅓**

## The Discriminant (b² − 4ac)
| Value | Roots |
|-------|-------|
| > 0 | Two distinct real roots |
| = 0 | One repeated real root |
| < 0 | No real roots |

## Word Problem
Rectangle: length (x + 5) cm, width (x − 2) cm, area 60 cm².
(x + 5)(x − 2) = 60 → x² + 3x − 70 = 0 → **(x − 7)(x + 10) = 0 → x = 7**
Length = 12 cm, Width = 5 cm`,
    },
    {
      title: 'Indices, Surds and Logarithms',
      type: 'text',
      content: `# Indices, Surds and Logarithms

## Laws of Indices
| Law | Example |
|-----|---------|
| aᵐ × aⁿ = aᵐ⁺ⁿ | x³ × x² = x⁵ |
| aᵐ ÷ aⁿ = aᵐ⁻ⁿ | y⁷ ÷ y³ = y⁴ |
| (aᵐ)ⁿ = aᵐⁿ | (x²)³ = x⁶ |
| a⁰ = 1 | 5⁰ = 1 |
| a⁻ⁿ = 1/aⁿ | x⁻² = 1/x² |
| a^(1/n) = ⁿ√a | 27^(1/3) = 3 |
| a^(m/n) = (ⁿ√a)ᵐ | 8^(2/3) = 4 |

## Surds
Irrational roots: √2, √3, √5, etc.

**Simplifying:** √12 = √(4×3) = **2√3**; √50 = **5√2**

**Adding (like surds only):** 3√2 + 5√2 = **8√2**; √12 + √3 = 2√3 + √3 = **3√3**

**Rationalising denominator:** 6/√3 = (6√3)/3 = **2√3**

## Logarithms
log_a(x) = n means aⁿ = x

**Laws:**
- log(AB) = log A + log B
- log(A/B) = log A − log B
- log(Aⁿ) = n log A

**Solving:** 2ˣ = 32 → x log 2 = log 32 → x = log 32/log 2 = **5**`,
    },
    {
      title: 'Variation and Proportion',
      type: 'text',
      content: `# Variation and Proportion

## Direct Variation (y ∝ x)
y = kx

When x = 4, y = 20: k = 20/4 = 5
When x = 7: y = 5 × 7 = **35**

Graph: straight line through the origin.

## Inverse Variation (y ∝ 1/x)
y = k/x → xy = k

When x = 6, y = 4: k = 24
When x = 8: y = 24/8 = **3**

## Joint Variation (y ∝ xz)
y = kxz

When x=2, z=3, y=36: k = 36/6 = 6
When x=5, z=4: y = 6×5×4 = **120**

## Partial Variation
y = a + bx (partly constant, partly varying)

When x=2, y=7 AND x=5, y=13:
7 = a + 2b ... (1)
13 = a + 5b ... (2)
Subtract: 6 = 3b → b=2, a=3
**y = 3 + 2x**

## Real-Life Applications
| Situation | Type |
|-----------|------|
| Wages and hours worked | Direct |
| Speed and time (fixed distance) | Inverse |
| Area = length × width | Joint |
| Taxi fare (fixed + per km) | Partial |`,
    },
  ],
}

const olevelMathGeometry: Course = {
  subjectCode: 'OL-MATH',
  title: 'O-Level Mathematics — Geometry, Trigonometry & Statistics',
  description: 'Covers circle theorems, trigonometry, mensuration, vectors and statistics for ZIMSEC O-Level Mathematics.',
  lessons: [
    {
      title: 'Circle Theorems',
      type: 'text',
      content: `# Circle Theorems

## Key Vocabulary
- **Chord:** line joining two points on a circle
- **Tangent:** line touching the circle at exactly one point
- **Cyclic quadrilateral:** all four vertices lie on a circle

## The Eight Theorems

1. **Angle at Centre** — angle at centre = twice angle at circumference (same arc)
2. **Angle in Semicircle** — angle in a semicircle = 90°
3. **Same Segment** — angles subtended by the same arc in the same segment are equal
4. **Cyclic Quadrilateral** — opposite angles add up to 180°
5. **Tangent-Radius** — tangent is perpendicular to radius at contact point
6. **Tangents from External Point** — equal in length
7. **Alternate Segment** — angle between tangent and chord = angle in alternate segment
8. **Perpendicular from Centre** — bisects the chord

## Worked Example
O is centre; angle AOB = 130°. Find angle ACB (C on major arc).

Using Theorem 4 (cyclic quad):
Reflex angle AOB = 360° − 130° = 230°
Angle ACB = 230°/2 = **115°**

## Practice
1. Cyclic quad angles: x, 85°, 2x, 55°. Find x.
2. Tangent PT from P; OT = 5, OP = 13. Find PT using Pythagoras.`,
    },
    {
      title: 'Trigonometry — SOH CAH TOA, Sine and Cosine Rules',
      type: 'text',
      content: `# Trigonometry

## SOH CAH TOA (Right-Angled Triangles)
| Ratio | Formula |
|-------|---------|
| sin θ | Opposite / Hypotenuse |
| cos θ | Adjacent / Hypotenuse |
| tan θ | Opposite / Adjacent |

**Example:** θ = 35°, hypotenuse = 12 cm. Find opposite.
opposite = 12 × sin 35° = 12 × 0.574 = **6.88 cm**

## Special Angles
| Angle | sin | cos | tan |
|-------|-----|-----|-----|
| 30° | ½ | √3/2 | 1/√3 |
| 45° | 1/√2 | 1/√2 | 1 |
| 60° | √3/2 | ½ | √3 |

## Sine Rule
a/sin A = b/sin B = c/sin C
Use: AAS or ASA or ambiguous SSA

**Example:** a=8, A=40°, B=60°. Find b.
b = 8 × sin 60° / sin 40° = **10.77 cm**

## Cosine Rule
a² = b² + c² − 2bc cos A
Use: SAS or SSS

**Example:** b=7, c=10, A=45°
a² = 49 + 100 − 2(7)(10)(0.707) = 149 − 98.99 ≈ 50
**a ≈ 7.07 cm**

## Bearings
Measured clockwise from North, written as 3 digits.
North = 000°, East = 090°, South = 180°, West = 270°`,
    },
    {
      title: 'Mensuration — Area and Volume',
      type: 'text',
      content: `# Mensuration

## 2D Shapes

| Shape | Area | Perimeter |
|-------|------|-----------|
| Rectangle | l × w | 2(l + w) |
| Triangle | ½ × base × height | a + b + c |
| Circle | πr² | 2πr |
| Trapezium | ½(a + b)h | sum of sides |
| Parallelogram | base × height | 2(a + b) |

**π ≈ 3.142 or 22/7**

## 3D Solids

| Solid | Volume | Surface Area |
|-------|--------|-------------|
| Cuboid | lwh | 2(lw + lh + wh) |
| Cylinder | πr²h | 2πr² + 2πrh |
| Sphere | 4/3 πr³ | 4πr² |
| Cone | 1/3 πr²h | πrl + πr² |

## Worked Example — Cylinder
Radius = 3.5 m, Height = 8 m

Volume = π × 3.5² × 8 = **307.9 m³**
Total SA = 2π(3.5)² + 2π(3.5)(8) = **252.9 m²**

## Composite Shape
L-shaped room: 10×8 m with 3×4 m removed
Area = 80 − 12 = **68 m²**`,
    },
    {
      title: 'Statistics — Averages, Spread and Probability',
      type: 'text',
      content: `# Statistics and Probability

## Measures of Central Tendency
Data: 5, 6, 6, 7, 8, 8, 8, 9

**Mean** = (5+6+6+7+8+8+8+9)/8 = **7.125**

**Median** = middle value (or average of two middle values)
Arranged: 5, 6, 6, 7, 8, 8, 8, 9 → median = (7+8)/2 = **7.5**

**Mode** = most frequent = **8** (appears 3 times)

**Range** = 9 − 5 = **4**

## Frequency Tables and Histograms
- x-axis: class intervals
- y-axis: frequency density = frequency ÷ class width
- Area of bar = frequency

## Cumulative Frequency (Ogive / S-curve)
Running total of frequencies.
- **Median** = value at n/2
- **Q₁** = value at n/4
- **Q₃** = value at 3n/4
- **IQR = Q₃ − Q₁**

## Probability
P(E) = favourable outcomes / total possible outcomes
0 ≤ P(E) ≤ 1

**Combined events (independent):**
P(A and B) = P(A) × P(B)
P(A or B) = P(A) + P(B) − P(A and B)
P(not A) = 1 − P(A)

**Example:** Bag: 4 red, 3 blue, 5 green balls.
P(red) = 4/12 = **⅓**; P(not green) = 7/12`,
    },
    {
      title: 'Vectors and Matrices',
      type: 'text',
      content: `# Vectors and Matrices

## Vectors
A vector has **magnitude AND direction**.

Column vector: v = (3, 4). Magnitude |v| = √(9+16) = **5**

**Vector path problems:** If OA = a and OB = b:
- AB = b − a
- Midpoint M: OM = ½(a + b)

**Parallel vectors:** v₁ = k·v₂ for some scalar k.

## Matrix Operations

### Addition
Add corresponding elements:
[[2,3],[1,4]] + [[5,1],[2,3]] = **[[7,4],[3,7]]**

### Multiplication (row × column)
[[2,1],[3,4]] × [[1,2],[3,0]] = **[[5,4],[15,6]]**

### Inverse of 2×2 Matrix
If M = [[a,b],[c,d]], det M = ad−bc

M⁻¹ = (1/det) × [[d,−b],[−c,a]]

**Example:** M = [[3,1],[5,2]], det = 6−5 = 1
M⁻¹ = [[2,−1],[−5,3]]

## Transformation Matrices

| Transformation | Matrix |
|---------------|--------|
| Reflection x-axis | [[1,0],[0,−1]] |
| Reflection y-axis | [[−1,0],[0,1]] |
| Rotation 90° CW | [[0,1],[−1,0]] |
| Rotation 180° | [[−1,0],[0,−1]] |
| Enlargement (scale k) | [[k,0],[0,k]] |`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// O-LEVEL PHYSICS
// ══════════════════════════════════════════════════════════

const olevelPhysics: Course = {
  subjectCode: 'OL-PHY',
  title: 'O-Level Physics — Mechanics, Waves & Electricity',
  description: 'Covers measurement, forces, motion, energy, waves and electricity for ZIMSEC O-Level Physics.',
  lessons: [
    {
      title: 'Measurement, SI Units and Scientific Notation',
      type: 'text',
      content: `# Measurement and SI Units

## SI Base Units
| Quantity | Unit | Symbol |
|----------|------|--------|
| Length | metre | m |
| Mass | kilogram | kg |
| Time | second | s |
| Temperature | kelvin | K |
| Electric current | ampere | A |

## Prefixes
| Prefix | Symbol | Multiplier |
|--------|--------|-----------|
| kilo | k | 10³ |
| centi | c | 10⁻² |
| milli | m | 10⁻³ |
| micro | μ | 10⁻⁶ |

5 km = 5 000 m | 3.5 mm = 0.0035 m

## Standard Form
1500 m = **1.5 × 10³ m**; 0.000045 kg = **4.5 × 10⁻⁵ kg**

## Measuring Instruments
| Instrument | Measures | Precision |
|-----------|----------|-----------|
| Ruler | Length | 1 mm |
| Vernier callipers | Small length | 0.1 mm |
| Micrometer | Very small length | 0.01 mm |
| Stopwatch | Time | 0.01 s |
| Thermometer | Temperature | 0.5°C |

## Significant Figures
3.45 m → 3 s.f. | 0.0027 g → 2 s.f. | 1.50 × 10³ → 3 s.f.

**Random errors** — unpredictable; reduced by averaging.
**Systematic errors** — consistent offset (e.g., wrongly calibrated instrument).`,
    },
    {
      title: 'Motion — Speed, Velocity, Acceleration and Equations',
      type: 'text',
      content: `# Motion

## Scalars vs Vectors
| Scalar | Vector |
|--------|--------|
| Distance | Displacement |
| Speed | Velocity |
| Mass | Weight |
| Time | Acceleration / Force |

## Key Equations
**Speed** = Distance / Time (m/s)

**Acceleration** = (v − u) / t (m/s²)

## Distance–Time Graphs
- Horizontal line → at rest
- Straight line → constant speed
- Gradient = speed

## Velocity–Time Graphs
- Horizontal → constant velocity
- Positive slope → acceleration
- Negative slope → deceleration
- **Gradient = acceleration**
- **Area under graph = distance**

## Equations of Uniform Motion (suvat)
1. v = u + at
2. s = ut + ½at²
3. v² = u² + 2as
4. s = ½(u + v)t

**Example:** Car accelerates 15 → 35 m/s in 10 s.
a = (35−15)/10 = **2 m/s²**
s = ½(15+35)×10 = **250 m**

## Free Fall
All objects fall with **g = 10 m/s²** (ignoring air resistance).
Stone dropped 80 m: s = ½gt² → t = √(2×80/10) = **4 s**`,
    },
    {
      title: "Forces and Newton's Laws",
      type: 'text',
      content: `# Forces and Newton's Laws

## Newton's Three Laws

### First Law (Law of Inertia)
An object remains at rest or moves at constant velocity unless a resultant force acts on it.

### Second Law
**F = ma** (Force in N, mass in kg, acceleration in m/s²)

Example: 2 000 kg car, a = 3 m/s² → F = 6 000 N

### Third Law
For every action there is an **equal and opposite reaction**.

## Weight and Mass
**W = mg** (g = 10 N/kg on Earth, ≈ 1.6 N/kg on Moon)

Mass = 50 kg → Weight on Earth = **500 N**

## Moments
**Moment = Force × perpendicular distance from pivot** (N·m)

**Principle of Moments:** clockwise moments = anticlockwise moments (equilibrium)

## Pressure
**P = F/A** (Pa = N/m²)

400 N on 0.02 m² → P = **20 000 Pa**

**Liquid pressure:** P = ρgh
- ρ = density (kg/m³), g = 10 m/s², h = depth (m)`,
    },
    {
      title: 'Work, Energy and Power',
      type: 'text',
      content: `# Work, Energy and Power

## Work Done
**W = Fd** (when force and motion are parallel)

50 N moves box 4 m → W = **200 J**
No work done when force is perpendicular to motion.

## Forms of Energy
- **Kinetic energy:** KE = ½mv²
- **Gravitational PE:** GPE = mgh
- Chemical, thermal, electrical, nuclear, light, sound

## Conservation of Energy
Energy is never created or destroyed — only converted.

Ball (0.5 kg) dropped from 10 m:
GPE = 0.5 × 10 × 10 = 50 J
At bottom: KE = 50 J → v = √(2×50/0.5) = **√200 ≈ 14.1 m/s**

## Power
**P = W/t = E/t** (watts, W = J/s)

Motor lifts 200 kg by 5 m in 10 s:
W = 200 × 10 × 5 = 10 000 J
P = 10 000/10 = **1 000 W = 1 kW**

## Efficiency
**Efficiency = (useful output/total input) × 100%**

Machine: input 500 J, useful output 350 J → **70% efficient**`,
    },
    {
      title: 'Electricity — Circuits and Electrical Power',
      type: 'text',
      content: `# Electricity

## Ohm's Law
**V = IR** (Voltage = Current × Resistance)

R = 20 Ω, V = 12 V → I = 12/20 = **0.6 A**

## Series Circuits
- Same current everywhere
- V_total = V₁ + V₂
- R_total = R₁ + R₂

## Parallel Circuits
- Same voltage across each branch
- I_total = I₁ + I₂
- 1/R_total = 1/R₁ + 1/R₂

Two 6 Ω in parallel: 1/R = 1/6 + 1/6 = 2/6 → **R = 3 Ω**

## Electrical Power
**P = IV = I²R = V²/R**

2 kW heater, 3 hours: Energy = 2 × 3 = **6 kWh**

## Domestic Safety
- **Fuse:** melts on excess current — protects the appliance
- **Earth wire:** green/yellow — carries fault current to ground
- **Circuit breaker:** trips automatically on overload

Wire colours: Live (brown), Neutral (blue), Earth (green/yellow)`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// O-LEVEL CHEMISTRY
// ══════════════════════════════════════════════════════════

const olevelChemistry: Course = {
  subjectCode: 'OL-CHEM',
  title: 'O-Level Chemistry — Atomic Structure, Bonding & Reactions',
  description: 'Covers atomic theory, chemical bonding, reactions, mole calculations and organic chemistry for ZIMSEC O-Level Chemistry.',
  lessons: [
    {
      title: 'Atomic Structure and the Periodic Table',
      type: 'text',
      content: `# Atomic Structure

## Sub-Atomic Particles
| Particle | Location | Mass | Charge |
|----------|----------|------|--------|
| Proton | Nucleus | 1 | +1 |
| Neutron | Nucleus | 1 | 0 |
| Electron | Shells | ~0 | −1 |

**Atomic number (Z):** number of protons
**Mass number (A):** protons + neutrons
Neutral atom: electrons = protons

**Example:** ₁₆³²S → 16 protons, 16 neutrons, 16 electrons

## Isotopes
Same element (same Z), different mass number (different neutrons).
**¹²C and ¹⁴C** — both have 6 protons; 6 and 8 neutrons respectively.

## Electronic Configuration
Shells fill in order: 2, 8, 8, 18...

| Element | Z | Config |
|---------|---|--------|
| Carbon | 6 | 2, 4 |
| Sodium | 11 | 2, 8, 1 |
| Chlorine | 17 | 2, 8, 7 |
| Calcium | 20 | 2, 8, 8, 2 |

## The Periodic Table
- Elements ordered by **increasing atomic number**
- **Period:** same number of electron shells (horizontal row)
- **Group:** same number of outer electrons → similar chemistry (vertical column)

**Trends across a period (→):** atomic radius decreases; ionisation energy increases
**Trends down a group (↓):** atomic radius increases; ionisation energy decreases`,
    },
    {
      title: 'Chemical Bonding and Structure',
      type: 'text',
      content: `# Chemical Bonding

## Ionic Bonding
Between **metals and non-metals** — transfer of electrons.

Na (2,8,1) → Na⁺ (2,8) + e⁻
Cl (2,8,7) + e⁻ → Cl⁻ (2,8,8)
→ NaCl formed by electrostatic attraction

**Properties:** high mp/bp, conduct when dissolved/molten, often soluble in water, brittle.

## Covalent Bonding
Between **non-metals** — sharing electron pairs.

**Simple molecular:** H₂O, CO₂, CH₄ — low mp/bp, no conduction
**Giant covalent:** Diamond (SiO₂) — very high mp/bp, hard, no conduction (except graphite)

## Metallic Bonding
Metal cations in a **sea of delocalised electrons**.

**Properties:** good conductors (free electrons), malleable/ductile (layers slide), high mp/bp.

## Comparison Table
| Property | Ionic | Simple covalent | Metallic |
|----------|-------|----------------|---------|
| Melting point | High | Low | High (mostly) |
| Electrical conductivity | Dissolved/molten | No | Yes |
| Water solubility | Usually soluble | Usually insoluble | Insoluble |`,
    },
    {
      title: 'Chemical Equations and Mole Calculations',
      type: 'text',
      content: `# Chemical Equations and Mole Calculations

## Balancing Equations
Atoms must be conserved.

2H₂ + O₂ → 2H₂O ✓
Fe + 2HCl → FeCl₂ + H₂ ✓

## The Mole
**1 mole = 6.02 × 10²³ particles** (Avogadro's constant)

**n = m/M** (moles = mass ÷ molar mass)

11 g of CO₂ (M = 44 g/mol): n = 11/44 = **0.25 mol**

## Gas Volume at RTP
1 mole of gas = **24 dm³** at room temperature and pressure

6 dm³ NH₃ = 6/24 = **0.25 mol**

## Concentration
**c = n/V** (mol/dm³)

0.5 mol NaOH in 250 cm³: c = 0.5/0.25 = **2 mol/dm³**

## Percentage Yield
% yield = (actual yield / theoretical yield) × 100%`,
    },
    {
      title: 'Types of Reactions and Tests',
      type: 'text',
      content: `# Types of Reactions

## Acid-Base Reactions
| Acid + ... | Products |
|-----------|---------|
| Metal | Salt + Hydrogen |
| Metal oxide | Salt + Water |
| Carbonate | Salt + Water + CO₂ |
| Alkali | Salt + Water |

pH: 0–6 acid | 7 neutral | 8–14 alkaline

## Redox Reactions
**OIL RIG** — Oxidation Is Loss (of electrons), Reduction Is Gain

Mg + CuSO₄ → MgSO₄ + Cu
- Mg → Mg²⁺ (oxidised; Mg is reducing agent)
- Cu²⁺ → Cu (reduced; CuSO₄ is oxidising agent)

## Electrolysis of Brine
- **Cathode (−):** 2H⁺ + 2e⁻ → H₂ (gas)
- **Anode (+):** 2Cl⁻ → Cl₂ + 2e⁻ (gas)
- **Solution:** NaOH remains

## Tests for Gases
| Gas | Test | Result |
|-----|------|--------|
| H₂ | Burning splint | "Pop" |
| O₂ | Glowing splint | Relights |
| CO₂ | Limewater | Turns milky |
| Cl₂ | Damp litmus | Bleaches white |
| NH₃ | Damp red litmus | Turns blue |`,
    },
    {
      title: 'Organic Chemistry — Alkanes, Alkenes and Polymers',
      type: 'text',
      content: `# Organic Chemistry

## Alkanes (CₙH₂ₙ₊₂) — Saturated
All single C–C bonds; **unreactive except combustion**.

CH₄ (methane), C₂H₆ (ethane), C₃H₈ (propane), C₄H₁₀ (butane)

**Complete combustion:** CH₄ + 2O₂ → CO₂ + 2H₂O
**Substitution (+ Cl₂, UV light):** CH₄ + Cl₂ → CH₃Cl + HCl

## Alkenes (CₙH₂ₙ) — Unsaturated
Contain **C=C double bond** → reactive.

C₂H₄ (ethene), C₃H₆ (propene)

**Addition reactions:**
- + H₂ → alkane (hydrogenation)
- + Br₂ (aq) → decolourises orange bromine water ← **test for alkenes!**
- + H₂O → alcohol (hydration)

## Polymers — Addition Polymerisation
Monomers join to form long chains:

nCH₂=CH₂ → −(CH₂−CH₂)ₙ− (poly(ethene) = polythene)

Uses: plastic bags, bottles, pipes (PVC), clothing (polyester)

**Problem:** most polymers are **non-biodegradable** → environmental pollution.
Solutions: recycling, biodegradable plastics, reducing plastic use.`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// O-LEVEL BIOLOGY
// ══════════════════════════════════════════════════════════

const olevelBiology: Course = {
  subjectCode: 'OL-BIO',
  title: 'O-Level Biology — Life Processes, Genetics & Ecology',
  description: 'Covers cell biology, transport, nutrition, respiration, genetics and ecology for ZIMSEC O-Level Biology.',
  lessons: [
    {
      title: 'Cell Structure and Organisation',
      type: 'text',
      content: `# Cell Structure and Organisation

## Animal vs Plant Cell
| Organelle | Animal | Plant | Function |
|-----------|--------|-------|---------|
| Cell membrane | ✓ | ✓ | Controls entry/exit |
| Cell wall | ✗ | ✓ (cellulose) | Support and shape |
| Nucleus | ✓ | ✓ | Controls cell; contains DNA |
| Mitochondria | ✓ | ✓ | Aerobic respiration (ATP) |
| Chloroplasts | ✗ | ✓ | Photosynthesis |
| Large vacuole | ✗ | ✓ | Stores sap; turgor pressure |
| Ribosomes | ✓ | ✓ | Protein synthesis |

## Specialised Cells
- **Red blood cells:** biconcave disc, no nucleus, haemoglobin → O₂ transport
- **Root hair cells:** long extension → increased SA for water absorption
- **Palisade cells:** many chloroplasts → photosynthesis
- **Nerve cells:** long axon + dendrites → rapid impulse transmission

## Levels of Organisation
Cell → Tissue → Organ → Organ System → Organism

## Using the Microscope
**Magnification** = size of image / actual size
**Actual size** = size of image / magnification

If image = 50 mm and magnification = ×200:
Actual size = 50/200 = **0.25 mm = 250 μm**`,
    },
    {
      title: 'Diffusion, Osmosis and Active Transport',
      type: 'text',
      content: `# Movement of Substances

## Diffusion
Movement from **high → low concentration** (down a concentration gradient) — **passive**, no energy.

Examples: O₂ into blood at alveoli; CO₂ from tissues to blood.

Factors affecting rate: concentration gradient, temperature, surface area, distance.

## Osmosis
Movement of **water** from **high water potential (dilute)** to **low water potential (concentrated)** through a **selectively permeable membrane** — passive.

### In Plant Cells
- **Turgid** (dilute external solution): water enters → cell swells → firm (turgor pressure) → supports plant
- **Plasmolysed** (concentrated external solution): water leaves → vacuole shrinks → cytoplasm pulls from wall

### In Animal Cells
- Distilled water → **haemolysis** (red blood cells burst)
- Concentrated salt → **crenation** (cells shrivel)

**Osmosis and blood:** red blood cells need isotonic solution (0.9% saline = blood plasma).

## Active Transport
Movement from **low → high concentration** using **ATP + carrier proteins** — **active**, requires energy.

Examples:
- Glucose absorption in small intestine (against gradient)
- Mineral ion uptake by root hair cells`,
    },
    {
      title: 'Photosynthesis',
      type: 'text',
      content: `# Photosynthesis

## Equation
$$6CO_2 + 6H_2O \\xrightarrow{\\text{light + chlorophyll}} C_6H_{12}O_6 + 6O_2$$

Takes place in **chloroplasts**. Chlorophyll absorbs red and blue light.

## Two Stages

### Light-Dependent Reactions (thylakoid membranes)
- Light splits water: **photolysis** → releases O₂, produces ATP and NADPH

### Light-Independent Reactions / Calvin Cycle (stroma)
- CO₂ fixed using ATP + NADPH → **glucose**

## Limiting Factors
- **Light intensity** — more light, faster rate (up to saturation)
- **CO₂ concentration** — more CO₂, faster rate
- **Temperature** — rises with temperature to ~35°C then drops (enzymes denature)
- **Water** — shortage closes stomata

## Testing a Leaf for Starch
1. Boil in water (2 min) — kills cells
2. Boil in ethanol — removes chlorophyll
3. Rinse in warm water — soften
4. Add iodine — **blue-black = starch present** ✓

## Uses of Glucose in Plants
Respiration (energy) | Cellulose (cell walls) | Starch (storage) | Sucrose (phloem transport) | Amino acids (+ nitrates from soil)`,
    },
    {
      title: 'Respiration — Aerobic and Anaerobic',
      type: 'text',
      content: `# Respiration

## Aerobic Respiration
**With oxygen — maximum energy (38 ATP)**

$$C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 38\\ ATP$$

Location: glycolysis (cytoplasm) + Krebs cycle + oxidative phosphorylation (mitochondria)

## Anaerobic Respiration
**Without oxygen — only 2 ATP**

### In Animals (lactic acid fermentation)
$$C_6H_{12}O_6 \\rightarrow 2C_3H_6O_3 + 2\\ ATP$$
→ causes muscle fatigue; **oxygen debt** — extra O₂ needed after exercise to oxidise lactic acid

### In Yeast (alcoholic fermentation)
$$C_6H_{12}O_6 \\rightarrow 2C_2H_5OH + 2CO_2 + 2\\ ATP$$
→ used in **bread making** (CO₂ raises dough) and **brewing** (ethanol)

## Comparison
| Feature | Aerobic | Anaerobic |
|---------|---------|-----------|
| Oxygen | Required | Not required |
| Products | CO₂ + H₂O | Lactic acid OR ethanol + CO₂ |
| ATP yield | 38 | 2 |
| Location | Cytoplasm + mitochondria | Cytoplasm only |`,
    },
    {
      title: 'Genetics — DNA, Inheritance and Natural Selection',
      type: 'text',
      content: `# Genetics and Inheritance

## DNA
Double helix of nucleotides. Base pairing: **A−T, C−G**
**Gene:** a section of DNA coding for a specific protein.

## Mitosis vs Meiosis
| | Mitosis | Meiosis |
|--|---------|---------|
| Purpose | Growth/repair | Sexual reproduction |
| Divisions | 1 | 2 |
| Daughter cells | 2 (diploid) | 4 (haploid) |
| Genetic variation | No | Yes (crossing over) |

## Mendelian Genetics
**Genotype:** genetic makeup (e.g. Tt)
**Phenotype:** observable characteristic
**Dominant (T):** expressed whenever present
**Recessive (t):** only expressed when homozygous (tt)

### Monohybrid Cross (Tt × Tt)
Gametes: T, t × T, t

F₂ ratio: TT : Tt : tt = 1:2:1 genotype; **3 tall : 1 short** phenotype

## Sex Determination
Females: XX | Males: XY
Father determines sex of offspring.

## Mutations
Random changes in DNA sequence.
Caused by: radiation, mutagens, replication errors.
**Sickle cell anaemia:** mutation in haemoglobin gene → sickle-shaped red blood cells.

## Natural Selection
1. Variation in population
2. More offspring than can survive
3. Best-adapted survive and reproduce
4. Favourable traits increase in frequency

**Example:** antibiotic resistance in bacteria.`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// O-LEVEL ENGLISH
// ══════════════════════════════════════════════════════════

const olevelEnglish: Course = {
  subjectCode: 'OL-ENG',
  title: 'O-Level English Language — Writing and Comprehension',
  description: 'Develops essay writing, comprehension, letter writing and grammar for ZIMSEC O-Level English Language.',
  lessons: [
    {
      title: 'Essay Writing — Structure and Types',
      type: 'text',
      content: `# Essay Writing

## Basic Structure
**Introduction:** hook + context + thesis statement
**Body (3–5 paragraphs):** PEEL — Point, Evidence, Explain, Link
**Conclusion:** restate thesis + summarise + final thought

## Types of Essays

### Argumentative/Persuasive
State a position; give 3+ reasons with evidence; refute counter-arguments.
Language: "It is evident that...", "Evidence suggests...", "Critics argue... however..."

### Descriptive
Paint a vivid picture using the 5 senses. Use figurative language.

### Narrative
Tell a story with plot (beginning → conflict → climax → resolution).

### Expository (Discursive)
Explain or inform. Use facts, logical order, neutral tone.

## Transitional Phrases
**Adding:** Furthermore | Moreover | In addition
**Contrasting:** However | Nevertheless | On the other hand
**Cause/Effect:** Therefore | Consequently | As a result
**Concluding:** In conclusion | To summarise | Overall`,
    },
    {
      title: 'Reading Comprehension and Summary Writing',
      type: 'text',
      content: `# Comprehension and Summary Writing

## Answering Comprehension Questions

**Literal:** Answer is directly stated. Paraphrase — don't copy chunks.

**Inferential:** Read between the lines. "This suggests..." / "The writer implies..."

**Vocabulary:** Use context clues. Substitute your answer to check it fits.

**Writer's Purpose:** Comment on effect on reader — tension, sympathy, humour, irony.

## Summary Writing — Step by Step
1. **Read** relevant paragraphs carefully
2. **Identify** key points (usually one per paragraph)
3. **List** them as notes
4. **Write** continuous prose in your OWN words
5. **Count** words and edit to fit the limit

### Rules
- Own words throughout — no copying
- No examples or minor details
- Complete sentences only
- Every word must earn its place

### Example
Original: *"The factory has operated since 1998 and employs over 500 workers. It recently announced plans to cut its workforce by 40%, causing anxiety among local families."*

Summary: **The factory plans to reduce its workforce by 40%, worrying families in the area.**`,
    },
    {
      title: 'Letter Writing — Formal and Informal',
      type: 'text',
      content: `# Letter Writing

## Formal Letter Format
\`\`\`
[Your Address]
[Date]

[Recipient Name/Title]
[Organisation]
[Address]

Dear Mr/Mrs [Surname],   OR   Dear Sir/Madam,

[Subject line — optional: Re: ...]

[Introduction — state your purpose]
[Body — main points, one per paragraph]
[Conclusion — expected action / polite close]

Yours sincerely,   [if name was used]
Yours faithfully,  [if "Dear Sir/Madam" was used]

[Full Name]
\`\`\`

**Formal language:** full forms ("I would like to"), polite tone, formal vocabulary.

## Informal Letter Format
\`\`\`
[Your Address]
[Date]

Dear [First name],

[Opening — how are you? Mention last contact]
[Body — news, events, stories]
[Closing — wishes, mention of next communication]

Lots of love / Best wishes / Your friend,
[Your name]
\`\`\`

**Informal language:** contractions (I'm, you're), colloquial phrases, personal tone.

## Common Mistakes
- Formal letter with informal language
- Wrong sign-off (sincerely vs faithfully)
- Missing date or address
- No concluding paragraph`,
    },
    {
      title: 'Grammar — Tenses, Voice and Reported Speech',
      type: 'text',
      content: `# Grammar

## Key Tenses
| Tense | Example |
|-------|---------|
| Simple Present | She *writes* every day. |
| Present Continuous | She *is writing* now. |
| Simple Past | She *wrote* yesterday. |
| Present Perfect | She *has written* three letters. |
| Past Perfect | She *had written* it before I arrived. |
| Simple Future | She *will write* tomorrow. |

## Active vs Passive Voice
**Active:** The teacher corrected the papers.
**Passive:** The papers *were corrected* by the teacher.

Passive = object → subject + be + past participle
Use passive: when agent unknown, to emphasise the action, in formal/scientific writing.

## Reported Speech — Changes
| Direct | Reported |
|--------|---------|
| Present simple | Past simple |
| Will | Would |
| Can | Could |
| "I" | He/she |
| "Now" | Then |
| "Today" | That day |
| "Tomorrow" | The next day |

**Example:**
Direct: *"I will come tomorrow," she said.*
Reported: *She said that she **would** come **the next day**.*`,
    },
    {
      title: 'Descriptive Writing and Figurative Language',
      type: 'text',
      content: `# Descriptive Writing

## Figurative Language

**Simile** — comparison using "like" or "as":
*Her voice was as cold as a winter dawn.*

**Metaphor** — direct comparison:
*Life is a journey with no map.*

**Personification** — human qualities to non-human:
*The wind whispered secrets through the trees.*

**Alliteration** — repeated initial consonants:
*The sun sank slowly over the silent savanna.*

**Onomatopoeia** — words that sound like their meaning:
*The drums thundered. Water splashed. Leaves rustled.*

## Describing a Place — Techniques
1. Establish time of day and weather
2. Wide view → close detail (or reverse)
3. Engage all five senses
4. Create atmosphere (peaceful, threatening, vibrant)

## Sample Descriptive Passage
*The market erupted into life at dawn. The air was thick with woodsmoke and the sweet rot of overripe guavas. Sellers called out in a chorus of Shona and Ndebele. Somewhere beneath it all, a radio crackled out chimurenga music, its rhythm threading through the noise like a heartbeat.*

## Powerful Openings
- In the action: *"Run!" Farai screamed, already halfway across the field.*
- Vivid detail: *The drought had lasted three seasons. The earth cracked like old pottery.*
- Intrigue: *My grandmother kept a secret for sixty years. I found it the day she died.*`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// O-LEVEL HISTORY
// ══════════════════════════════════════════════════════════

const olevelHistory: Course = {
  subjectCode: 'OL-HIST',
  title: 'O-Level History — Zimbabwe and Southern Africa',
  description: 'Covers pre-colonial kingdoms, European colonisation, the liberation struggle and independence for ZIMSEC O-Level History.',
  lessons: [
    {
      title: 'Great Zimbabwe and Pre-Colonial Kingdoms',
      type: 'text',
      content: `# Pre-Colonial Zimbabwe

## Great Zimbabwe (c.1100–1450)
Stone-walled complex in south-east Zimbabwe — capital of a powerful kingdom.

**Key facts:**
- Built over 300 years using **dry-stone construction** (no mortar)
- The **Great Enclosure** is the largest ancient sub-Saharan structure
- Population at peak: ~18 000 people
- Economy: cattle, farming, gold and ivory trade with East African coast
- Traded for Chinese porcelain, Persian pottery, glass beads

**Decline:** over-use of land; collapse of trade routes; population outgrew food supply.

## The Mutapa (Mwene Mutapa) State (c.1430–1760)
Founded by **Mutota** — moved north seeking salt and new land.

- Centralised state with divine kingship
- Controlled gold and ivory trade to Swahili coast
- Portuguese arrived 1500s seeking to control trade
- 1629 Treaty of Kuranga — Mutapa became a Portuguese vassal

## The Rozvi (Changamire) State (1680–1834)
Founded by **Changamire Dombo** after rebelling against Mutapa.
- Expelled Portuguese (1693)
- Known for skilled stonewalling (Zimbabwe ruins in south-west)
- Destroyed by Nguni invasions (Ndebele/Ngoni) in 1820s–1830s

## The Ndebele Kingdom
Under **Mzilikazi** (1830s) and later **Lobengula** — moved into south-western Zimbabwe from South Africa.
- Impis (regiments) and cattle as basis of military/social life
- Capital at **Bulawayo**`,
    },
    {
      title: 'European Colonisation and the Rudd Concession',
      type: 'text',
      content: `# Colonisation of Zimbabwe

## The Rudd Concession (1888)
Cecil John Rhodes (head of BSAC) sent agents to trick Lobengula.

**What Lobengula believed he was granting:**
- Rights to dig one hole
- 10 rifles, £100/month, a gunboat

**What the written document actually said:**
- Exclusive rights to all metals and minerals throughout his kingdom
- Authority to do "whatever was necessary"

**Result:** Rhodes obtained a Royal Charter (1889) for the British South Africa Company.

## The Pioneer Column (1890)
500 settlers and 200 BSAC police entered Mashonaland.
13 September 1890: Raised British flag at what became **Fort Salisbury** (now Harare).

## Impact of Colonisation
- **Land:** best land taken; Africans pushed to Native Reserves
- **Labour:** Hut Tax (1894) — Africans forced to work for wages
- **Cattle:** seized after 1893 Ndebele War
- **Authority:** chiefs lost political and judicial power

## First Chimurenga (1896–97)

### Causes
- Land and cattle seized; forced labour and taxation
- Rinderpest (1896) destroyed Ndebele cattle
- Loss of sovereignty and dignity

### Key Figures
- **Nehanda Charwe Nyakasikana** — spirit medium (svikiro) in Mashonaland
- **Sekuru Kaguvi** — spirit medium and military leader

Both were captured and **executed in 1898**.

**Nehanda's last words:** *"My bones will rise again."*

This became the rallying cry of later liberation movements.`,
    },
    {
      title: 'The Rise of African Nationalism',
      type: 'text',
      content: `# African Nationalism in Zimbabwe (1920s–1960s)

## Early Organisations
- **ICU** (Industrial and Commercial Workers Union, 1920s) — wages and conditions
- **SRZANC** (1957) — Joshua Nkomo; banned 1959

## Sequence of Nationalist Organisations
1. **NDP** (National Democratic Party, 1960) — banned 1961
2. **ZAPU** (Zimbabwe African People's Union, 1961) — Joshua Nkomo; banned 1962
3. **ZANU** (Zimbabwe African National Union, 1963) — split from ZAPU
   - President: Ndabaningi Sithole | Secretary-General: **Robert Mugabe**
4. **ZAPU** continued — Joshua Nkomo; based in Zambia

**Key achievement:** 1956 Salisbury Bus Boycott — successful non-violent protest against fare increases.

## Ian Smith and UDI (1965)
- White Rhodesian PM **Ian Smith** refused to give majority rule
- **11 November 1965:** Unilateral Declaration of Independence (UDI) — illegal; to maintain white minority rule
- UN and UK imposed sanctions
- This pushed nationalists toward armed struggle`,
    },
    {
      title: 'The Liberation War (Second Chimurenga, 1966–1979)',
      type: 'text',
      content: `# The Liberation War

## Battle of Chinhoyi (28 April 1966)
First armed battle of the liberation war — 7 ZANLA fighters attacked near Chinhoyi; all killed.
28 April is now celebrated as **Chimurenga Day**.

## The Two Liberation Armies

| | ZANLA | ZIPRA |
|--|-------|-------|
| Party | ZANU (PF) | ZAPU |
| Strategy | People's War — mobilise rural masses | Conventional warfare |
| Base | Mozambique, Tanzania | Zambia, Angola |

## People's War Strategy (ZANLA)
- Fighters lived among the rural population — "fish in the sea of the people"
- Held **pungwes** (all-night meetings) to educate villagers
- Used spirit mediums to legitimise the struggle
- **Vanamujibha** (male) and **Chimbwidos** (female) youth supporters provided intelligence

## Role of Front Line States
Zambia, Mozambique (post-1975), Tanzania, Botswana provided bases, training and passage.

## Lancaster House Agreement (December 1979)
Negotiations in London — ceasefire; elections under British supervision.`,
    },
    {
      title: 'Independence and Post-Independence Zimbabwe',
      type: 'text',
      content: `# Independence — 18 April 1980

## The 1980 Elections
- ZANU (PF): **57/80 seats** → Robert Mugabe became Prime Minister
- ZAPU: 20 seats
- **Zimbabwe** formally independent — named after Great Zimbabwe

## Significance
- End of 90 years of colonial rule
- First African-majority government
- Inspired liberation movements across southern Africa (Namibia, South Africa)
- Bob Marley performed at independence celebrations in Rufaro Stadium

## Post-Independence Challenges

### Land Reform
- Fast Track Land Reform Programme (2000) — seizure of white-owned farms
- Led to economic crisis: hyperinflation, food shortages

### Gukurahundi (1982–87)
5th Brigade deployed in Matabeleland — thousands of civilians killed.
Remains a deeply painful chapter in Zimbabwe's history.

### Economic Decline (1990s–2000s)
- Hyperinflation (peak: 500 billion% in 2008)
- USD adopted in 2009 to stabilise economy

### 2017 Military Intervention
- Robert Mugabe (President since 1980) removed after 37 years
- **Emmerson Mnangagwa** became President

## Zimbabwe Today
- 18 April remains **Independence Day**
- Great Zimbabwe is a UNESCO World Heritage Site
- Zimbabwe participates in SADC, African Union and United Nations`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// A-LEVEL PURE MATHEMATICS
// ══════════════════════════════════════════════════════════

const alevelPureMath: Course = {
  subjectCode: 'AL-PMATH',
  title: 'A-Level Pure Mathematics — Calculus, Algebra and Functions',
  description: 'Covers functions, differentiation, integration, sequences and vectors for ZIMSEC A-Level Pure Mathematics.',
  lessons: [
    {
      title: 'Functions — Domain, Range, Composite and Inverse',
      type: 'text',
      content: `# Functions

## Definitions
**Function** f: A → B maps every element of domain A to exactly **one** element in B.
**Domain:** valid input values | **Range:** actual output values

## Composite Functions
fg(x) = f(g(x)) — apply g first, then f.

f(x) = 2x + 1, g(x) = x²:
- fg(x) = f(x²) = **2x² + 1**
- gf(x) = g(2x+1) = **(2x+1)²**
Note: fg ≠ gf in general.

## Inverse Functions
f⁻¹ exists only if f is **one-to-one**.

**Finding f⁻¹:** write y = f(x), rearrange for x, then swap x and y.

f(x) = (3x−2)/5 → y = (3x−2)/5 → 3x = 5y+2 → **f⁻¹(x) = (5x+2)/3**

Graph of f⁻¹ = reflection of f in **y = x**.

## Transformations
| Transformation | Effect |
|---------------|--------|
| f(x) + a | Translate up a units |
| f(x + a) | Translate left a units |
| −f(x) | Reflect in x-axis |
| f(−x) | Reflect in y-axis |
| af(x) | Vertical stretch ×a |
| f(ax) | Horizontal stretch ×(1/a) |`,
    },
    {
      title: 'Differentiation — Rules, Chain, Product and Quotient',
      type: 'text',
      content: `# Differentiation

## Standard Derivatives
| f(x) | f'(x) |
|------|-------|
| xⁿ | nxⁿ⁻¹ |
| eˣ | eˣ |
| eᵃˣ | aeᵃˣ |
| ln x | 1/x |
| sin x | cos x |
| cos x | −sin x |
| tan x | sec²x |

## Chain Rule
d/dx[f(g(x))] = f'(g(x)) · g'(x)

y = (3x+1)⁵: dy/dx = 5(3x+1)⁴ × 3 = **15(3x+1)⁴**

## Product Rule
d/dx[uv] = u(dv/dx) + v(du/dx)

y = x² sin x: dy/dx = **x² cos x + 2x sin x**

## Quotient Rule
d/dx[u/v] = (v·du/dx − u·dv/dx) / v²

## Tangents and Normals
At (a, f(a)):
- Tangent gradient = f'(a)
- **Tangent:** y − f(a) = f'(a)(x − a)
- **Normal:** gradient = −1/f'(a)

y = x³ − 2x at x = 2: f(2) = 4; f'(2) = 10
**Tangent: y = 10x − 16**`,
    },
    {
      title: 'Applications of Differentiation — Optimisation',
      type: 'text',
      content: `# Applications of Differentiation

## Stationary Points
At stationary point: **dy/dx = 0**

### Second Derivative Test
- d²y/dx² > 0 → **minimum**
- d²y/dx² < 0 → **maximum**

y = x³ − 3x² − 9x + 2:
dy/dx = 3x² − 6x − 9 = 3(x+1)(x−3) = 0 → x = −1 or x = 3
d²y/dx² = 6x − 6:
- x = −1: −12 → **maximum** at (−1, 7)
- x = 3: +12 → **minimum** at (3, −25)

## Optimisation
1. Define variable and write equation for quantity to optimise
2. Use constraint to eliminate one variable
3. Differentiate, set = 0, solve
4. Verify maximum or minimum

**Example:** Farmer has 100 m of fencing for a rectangular paddock.
2l + 2w = 100 → l = 50 − w
A = w(50−w) = 50w − w²
dA/dw = 50 − 2w = 0 → w = 25, l = 25
**Maximum area = 625 m²**

## Connected Rates of Change
dV/dt = dV/dr × dr/dt

Sphere radius increases at 0.5 cm/s; find dV/dt when r = 3 cm:
dV/dr = 4πr² = 36π; dV/dt = 36π × 0.5 = **18π cm³/s**`,
    },
    {
      title: 'Integration — Techniques and Area',
      type: 'text',
      content: `# Integration

## Standard Integrals
| f(x) | ∫f(x)dx |
|------|---------|
| xⁿ | xⁿ⁺¹/(n+1) + C |
| 1/x | ln|x| + C |
| eˣ | eˣ + C |
| eᵃˣ | eᵃˣ/a + C |
| sin x | −cos x + C |
| cos x | sin x + C |
| sin(ax) | −cos(ax)/a + C |
| cos(ax) | sin(ax)/a + C |

## Integration by Substitution
Let u = g(x): ∫f(g(x))·g'(x) dx = ∫f(u) du

∫2x(x²+1)⁴ dx — let u = x²+1, du = 2x dx:
= ∫u⁴ du = **u⁵/5 + C = (x²+1)⁵/5 + C**

## Integration by Parts
∫u(dv/dx) dx = uv − ∫v(du/dx) dx
*LIATE* rule for choosing u.

∫xeˣ dx — u = x, dv/dx = eˣ:
= xeˣ − ∫eˣ dx = **eˣ(x−1) + C**

## Definite Integrals and Area
Area under y = x²+1 from x=0 to x=3:
[x³/3 + x]₀³ = (9+3) − 0 = **12 square units**

Area between curves: ∫ₐᵇ [f(x)−g(x)] dx (when f ≥ g)`,
    },
    {
      title: 'Sequences, Series and the Binomial Theorem',
      type: 'text',
      content: `# Sequences and Series

## Arithmetic Sequences (AP)
Common difference d.

nth term: **aₙ = a + (n−1)d**
Sum: **Sₙ = n/2[2a + (n−1)d]**

5, 8, 11, 14...: a=5, d=3 → a₁₀ = 5+27 = **32**; S₁₀ = 5×37 = **185**

## Geometric Sequences (GP)
Common ratio r.

nth term: **aₙ = arⁿ⁻¹**
Sum: **Sₙ = a(1−rⁿ)/(1−r)**

Sum to infinity (|r| < 1): **S∞ = a/(1−r)**

16, 8, 4... (a=16, r=½): S∞ = 16/(1−½) = **32**

## Binomial Theorem
$$(1+x)^n = \\sum_{r=0}^{n} \\binom{n}{r} x^r$$

**Expand (1+2x)⁴:**
= 1 + 4(2x) + 6(2x)² + 4(2x)³ + (2x)⁴
= **1 + 8x + 24x² + 32x³ + 16x⁴**

**Approximation** (|x| small):
(1+x)ⁿ ≈ 1 + nx + n(n−1)x²/2

(0.99)⁶ = (1−0.01)⁶ ≈ 1 − 0.06 + 0.0015 = **0.9415** ✓`,
    },
  ],
}

// ══════════════════════════════════════════════════════════
// EXPORT ALL COURSES
// ══════════════════════════════════════════════════════════

export const allCourses: Course[] = [
  primaryMath,
  primaryEnglish,
  olevelMathAlgebra,
  olevelMathGeometry,
  olevelPhysics,
  olevelChemistry,
  olevelBiology,
  olevelEnglish,
  olevelHistory,
  alevelPureMath,
]
