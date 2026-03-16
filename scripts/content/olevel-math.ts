export const olevelMathAlgebra = {
  subjectCode: 'OL-MATH',
  title: 'O-Level Mathematics — Algebra',
  description: 'Covers algebraic expressions, equations, functions and indices aligned with the ZIMSEC O-Level Mathematics syllabus.',
  lessons: [
    {
      title: 'Algebraic Expressions and Simplification',
      type: 'text' as const,
      content: `# Algebraic Expressions and Simplification

## Learning Objectives
- Understand variables, terms, expressions and equations
- Collect like terms and simplify expressions
- Expand brackets using the distributive law

---

## Key Vocabulary
- **Variable:** a letter representing an unknown (x, y, n)
- **Term:** a number, variable, or product of both (5x, -3y², 7)
- **Expression:** terms connected by + or − (3x + 2y − 5)
- **Coefficient:** the number in front of a variable (in 5x, coefficient = 5)

---

## Collecting Like Terms
Like terms have the **same variable and power**.

**Example:** Simplify 3x + 5y − x + 2y
= (3x − x) + (5y + 2y)
= **2x + 7y**

**Example:** Simplify 4a² + 3a − 2a² + a − 5
= (4a² − 2a²) + (3a + a) − 5
= **2a² + 4a − 5**

---

## Expanding Brackets
**Single bracket:** a(b + c) = ab + ac

**Example:** 3(2x − 5) = 6x − 15

**Double brackets (FOIL):** (a + b)(c + d) = ac + ad + bc + bd

**Example:** (x + 3)(x − 2)
= x² − 2x + 3x − 6
= **x² + x − 6**

**Difference of two squares:** (a + b)(a − b) = a² − b²

**Example:** (x + 5)(x − 5) = x² − 25

**Perfect square:** (a + b)² = a² + 2ab + b²

**Example:** (x + 4)² = x² + 8x + 16

---

## Factorising
Factorising is the **reverse of expanding**.

**Common factor:** 6x + 10 = 2(3x + 5)

**Grouping:** ax + ay + bx + by = a(x + y) + b(x + y) = **(a + b)(x + y)**

**Trinomials:** x² + 5x + 6 = (x + 2)(x + 3)
→ Find two numbers that multiply to +6 and add to +5: **2 and 3**

**Difference of squares:** x² − 9 = (x + 3)(x − 3)

---

## Practice Questions
1. Simplify: 5x² − 3x + 2x² + 7x − 4
2. Expand: (2x − 3)(x + 5)
3. Factorise: x² − x − 12
4. Factorise fully: 4x² − 16
`,
    },
    {
      title: 'Linear Equations and Inequalities',
      type: 'text' as const,
      content: `# Linear Equations and Inequalities

## Learning Objectives
- Solve linear equations in one variable
- Solve simultaneous linear equations
- Solve linear inequalities and represent solutions on a number line

---

## Solving Linear Equations
**Goal:** isolate the variable on one side.

**Example 1:** Solve 3x − 7 = 14
3x = 14 + 7 = 21
x = 21 ÷ 3 = **7**

**Example 2:** Solve 2(x + 4) = 3x − 1
2x + 8 = 3x − 1
8 + 1 = 3x − 2x
**x = 9**

**Example 3 (fractions):** Solve x/3 + x/4 = 7
Multiply all terms by 12 (LCM of 3 and 4):
4x + 3x = 84
7x = 84
**x = 12**

---

## Simultaneous Equations

### Substitution Method
Solve: y = 2x − 1 and 3x + y = 14
Substitute y = 2x − 1 into the second equation:
3x + (2x − 1) = 14
5x = 15 → **x = 3**, then y = 2(3) − 1 = **5**

### Elimination Method
Solve: 3x + 2y = 12 and 5x − 2y = 4
Add the equations (2y cancels):
8x = 16 → **x = 2**, then y = (12 − 6)/2 = **3**

---

## Linear Inequalities
Treat like an equation, **BUT** flip the inequality sign when multiplying/dividing by a negative number.

**Example:** Solve −2x + 3 > 7
−2x > 4
x < −2 (sign flips — dividing by −2)

**Representing on a number line:**
- Open circle (○) for < or >
- Closed circle (●) for ≤ or ≥

---

## Practice Questions
1. Solve: 4(2x − 3) = 2(x + 9)
2. Solve simultaneously: 2x + 3y = 7 and x − y = 1
3. Solve and show on number line: 3x − 5 ≤ 10
`,
    },
    {
      title: 'Quadratic Equations',
      type: 'text' as const,
      content: `# Quadratic Equations

## Learning Objectives
- Solve quadratic equations by factorisation
- Solve by completing the square
- Apply the quadratic formula
- Solve problems involving quadratic equations

---

## What is a Quadratic Equation?
Standard form: **ax² + bx + c = 0** (where a ≠ 0)

---

## Method 1 — Factorisation
If the product of two factors = 0, then at least one factor = 0.

**Example:** Solve x² + 5x + 6 = 0
Factorise: (x + 2)(x + 3) = 0
x + 2 = 0 → **x = −2**
x + 3 = 0 → **x = −3**

**Example:** Solve 2x² + 7x − 4 = 0
(2x − 1)(x + 4) = 0
**x = ½ or x = −4**

---

## Method 2 — Completing the Square
**Example:** Solve x² + 6x − 7 = 0

x² + 6x = 7
(x + 3)² − 9 = 7 → half coefficient of x, square it
(x + 3)² = 16
x + 3 = ±4
**x = 1 or x = −7**

---

## Method 3 — Quadratic Formula
For ax² + bx + c = 0:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

**Example:** Solve 3x² − 5x − 2 = 0 (a=3, b=−5, c=−2)
x = (5 ± √(25 + 24)) / 6
x = (5 ± 7) / 6
**x = 2 or x = −⅓**

---

## The Discriminant (b² − 4ac)
| Value | Nature of roots |
|-------|----------------|
| b² − 4ac > 0 | Two distinct real roots |
| b² − 4ac = 0 | Two equal roots (repeated root) |
| b² − 4ac < 0 | No real roots |

---

## Word Problem
The length of a rectangle is (x + 5) cm and the width is (x − 2) cm. The area is 60 cm². Find x.

(x + 5)(x − 2) = 60
x² + 3x − 10 = 60
x² + 3x − 70 = 0
(x + 10)(x − 7) = 0
x = 7 (since length must be positive)
**Length = 12 cm, Width = 5 cm**
`,
    },
    {
      title: 'Indices, Surds and Logarithms',
      type: 'text' as const,
      content: `# Indices, Surds and Logarithms

## Learning Objectives
- Apply the laws of indices
- Simplify surds and rationalise denominators
- Understand logarithms as the inverse of powers

---

## Laws of Indices
For any base a:

| Law | Rule | Example |
|-----|------|---------|
| Multiplication | a^m × a^n = a^(m+n) | x³ × x² = x⁵ |
| Division | a^m ÷ a^n = a^(m−n) | y⁷ ÷ y³ = y⁴ |
| Power of a power | (a^m)^n = a^(mn) | (x²)³ = x⁶ |
| Zero index | a⁰ = 1 | 5⁰ = 1 |
| Negative index | a^(−n) = 1/aⁿ | x⁻² = 1/x² |
| Fractional index | a^(1/n) = ⁿ√a | 27^(⅓) = ∛27 = 3 |
| Fractional index | a^(m/n) = (ⁿ√a)^m | 8^(⅔) = (∛8)² = 4 |

**Example:** Simplify (2x³y)² ÷ (4xy²)
= 4x⁶y² ÷ 4xy²
= **x⁵**

---

## Surds
A surd is an irrational root: √2, √3, √5, ∛7, etc.

### Simplifying Surds
√12 = √(4 × 3) = 2√3

√50 = √(25 × 2) = 5√2

### Adding/Subtracting Surds (like terms only)
3√2 + 5√2 = 8√2

√12 + √3 = 2√3 + √3 = 3√3

### Rationalising the Denominator
Multiply top and bottom by the surd:

6/√3 = (6 × √3)/(√3 × √3) = 6√3/3 = **2√3**

---

## Logarithms
**log_a(x) = n** means **a^n = x**

log₁₀(1000) = 3 because 10³ = 1000

### Laws of Logarithms
- log(AB) = log A + log B
- log(A/B) = log A − log B
- log(Aⁿ) = n log A

**Example:** Solve 2^x = 32
log(2^x) = log 32
x log 2 = log 32
x = log 32 / log 2 = **5**
`,
    },
    {
      title: 'Variation and Proportion',
      type: 'text' as const,
      content: `# Variation and Proportion

## Learning Objectives
- Distinguish between direct, inverse, joint and partial variation
- Form equations connecting variables
- Solve problems involving variation

---

## Direct Variation
**y varies directly as x** means y = kx (k is the constant of variation).

**Example:** y is directly proportional to x. When x = 4, y = 20. Find y when x = 7.
k = y/x = 20/4 = 5
When x = 7: y = 5 × 7 = **35**

**Graph:** a straight line through the origin.

---

## Inverse Variation
**y varies inversely as x** means y = k/x (or xy = k).

**Example:** y is inversely proportional to x. When x = 6, y = 4. Find y when x = 8.
k = xy = 6 × 4 = 24
When x = 8: y = 24/8 = **3**

---

## Joint Variation
**y varies jointly as x and z** means y = kxz.

**Example:** y ∝ xz. When x = 2, z = 3, y = 36. Find y when x = 5, z = 4.
k = y/(xz) = 36/6 = 6
When x = 5, z = 4: y = 6 × 5 × 4 = **120**

---

## Partial Variation
y is partly constant and partly varies with x:
**y = a + bx**

**Example:** y = a + bx. When x = 2, y = 7 and when x = 5, y = 13.
7 = a + 2b ...(1)
13 = a + 5b ...(2)
Subtract (1) from (2): 6 = 3b → b = 2, then a = 3
**y = 3 + 2x**

---

## Real-Life Applications

| Situation | Type |
|-----------|------|
| Wages and hours worked | Direct |
| Speed and time (fixed distance) | Inverse |
| Area of rectangle (length × width) | Joint |
| Taxi fare (fixed charge + per km) | Partial |

---

## Practice
1. P varies directly as Q². When Q = 3, P = 36. Find P when Q = 5.
2. A varies inversely as √B. When B = 9, A = 8. Find A when B = 4.
`,
    },
  ],
}

export const olevelMathGeometry = {
  subjectCode: 'OL-MATH',
  title: 'O-Level Mathematics — Geometry, Trigonometry & Statistics',
  description: 'Covers circle theorems, trigonometry, mensuration and statistics for ZIMSEC O-Level Mathematics.',
  lessons: [
    {
      title: 'Circle Theorems',
      type: 'text' as const,
      content: `# Circle Theorems

## Learning Objectives
- State and apply all eight circle theorems
- Prove simple circle theorem results
- Find unknown angles using circle theorems

---

## Key Vocabulary
- **Chord:** a line segment joining two points on a circle
- **Arc:** a portion of the circumference
- **Tangent:** a line that touches the circle at exactly one point
- **Cyclic quadrilateral:** a quadrilateral with all four vertices on a circle

---

## The Eight Circle Theorems

### Theorem 1 — Angle at Centre
The angle subtended at the centre is **twice** the angle subtended at the circumference by the same arc.

*Reflex angle at O = 2 × angle at circumference*

### Theorem 2 — Angle in Semicircle
The angle in a semicircle (angle subtended by a diameter) is **90°**.

### Theorem 3 — Angles in the Same Segment
Angles subtended by the same arc in the same segment are **equal**.

### Theorem 4 — Opposite Angles in Cyclic Quadrilateral
Opposite angles of a cyclic quadrilateral **add up to 180°**.

### Theorem 5 — Tangent-Radius
A tangent to a circle is **perpendicular** to the radius at the point of contact.

### Theorem 6 — Tangent from External Point
Tangents drawn from an external point to a circle are **equal in length**.

### Theorem 7 — Alternate Segment (Tangent-Chord)
The angle between a tangent and a chord equals the angle in the **alternate segment**.

### Theorem 8 — Perpendicular from Centre to Chord
The perpendicular from the centre to a chord **bisects** the chord.

---

## Worked Example
O is the centre. Angle AOB = 130°. Find angle ACB (where C is on the major arc).

Angle ACB = 180° − (130°/2) = 180° − 65° = **115°**
*(Angle in major segment = 180° − half the reflex angle at centre)*

---

## Practice
1. A cyclic quadrilateral has angles x, 85°, 2x and 55°. Find x.
2. A tangent from point P touches the circle at T. OT = 5 cm, OP = 13 cm. Find PT.
`,
    },
    {
      title: 'Trigonometry — Ratios and Applications',
      type: 'text' as const,
      content: `# Trigonometry — Ratios and Applications

## Learning Objectives
- Use SOH CAH TOA for right-angled triangles
- Apply the sine rule and cosine rule
- Solve 2D and 3D problems using trigonometry

---

## Trigonometric Ratios (Right-Angled Triangle)

**SOH CAH TOA:**

| Ratio | Formula | Memory |
|-------|---------|--------|
| Sine | sin θ = Opposite/Hypotenuse | **S**OH |
| Cosine | cos θ = Adjacent/Hypotenuse | C**A**H |
| Tangent | tan θ = Opposite/Adjacent | TO**A** |

**Example:** In a right-angled triangle, angle = 35°, hypotenuse = 12 cm. Find the opposite side.
sin 35° = Opposite/12
Opposite = 12 × sin 35° = 12 × 0.574 = **6.88 cm**

---

## Special Angles

| Angle | sin | cos | tan |
|-------|-----|-----|-----|
| 0° | 0 | 1 | 0 |
| 30° | ½ | √3/2 | 1/√3 |
| 45° | 1/√2 | 1/√2 | 1 |
| 60° | √3/2 | ½ | √3 |
| 90° | 1 | 0 | undefined |

---

## The Sine Rule
$$\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}$$

Use when you know: AAS, ASA, or SSA (ambiguous case)

**Example:** In triangle ABC, a = 8 cm, A = 40°, B = 60°. Find b.
b/sin 60° = 8/sin 40°
b = 8 × sin 60° / sin 40° = **10.77 cm**

---

## The Cosine Rule
a² = b² + c² − 2bc cos A

Use when you know: SAS or SSS

**Example:** a = ?, b = 7, c = 10, A = 45°
a² = 49 + 100 − 2(7)(10)(cos 45°)
a² = 149 − 98.99 = 50.01
**a = 7.07 cm**

---

## Bearings
Bearings are measured **clockwise from North**, written as 3 digits.
North = 000°, East = 090°, South = 180°, West = 270°
`,
    },
    {
      title: 'Mensuration — Area and Volume',
      type: 'text' as const,
      content: `# Mensuration — Area, Perimeter and Volume

## Learning Objectives
- Calculate perimeter and area of 2D shapes
- Calculate surface area and volume of 3D solids
- Solve problems involving composite shapes

---

## 2D Shapes — Formulas

| Shape | Perimeter | Area |
|-------|-----------|------|
| Rectangle | 2(l + w) | lw |
| Triangle | a + b + c | ½ base × height |
| Circle | 2πr | πr² |
| Trapezium | sum of sides | ½(a + b)h |
| Parallelogram | 2(a + b) | base × height |

**Take π = 3.142 or 22/7**

---

## 3D Solids — Formulas

| Solid | Volume | Surface Area |
|-------|--------|-------------|
| Cuboid | l × w × h | 2(lw + lh + wh) |
| Cylinder | πr²h | 2πr² + 2πrh |
| Sphere | (4/3)πr³ | 4πr² |
| Cone | (1/3)πr²h | πrl + πr² |
| Pyramid | (1/3) × base area × h | base + lateral faces |

---

## Worked Example — Cylinder
A cylindrical tank has radius 3.5 m and height 8 m. Find its volume and total surface area.

Volume = πr²h = 3.142 × 3.5² × 8 = **307.9 m³**
Curved SA = 2πrh = 2 × 3.142 × 3.5 × 8 = 175.96 m²
Total SA = 2πr² + curved = 2 × 3.142 × 12.25 + 175.96 = **252.9 m²**

---

## Worked Example — Composite Shape
Find the area of an L-shaped room: 10 m × 8 m with a 3 m × 4 m rectangle removed.

Area = (10 × 8) − (3 × 4) = 80 − 12 = **68 m²**
`,
    },
    {
      title: 'Statistics and Probability',
      type: 'text' as const,
      content: `# Statistics and Probability

## Learning Objectives
- Calculate mean, median, mode and range
- Construct and interpret frequency tables, histograms and cumulative frequency curves
- Apply basic probability rules

---

## Measures of Central Tendency

### Mean
$$\\bar{x} = \\frac{\\sum fx}{\\sum f}$$

**Example:** Scores: 5, 8, 6, 7, 9, 8, 6, 8
Mean = (5+8+6+7+9+8+6+8)/8 = 57/8 = **7.125**

### Median
Middle value when data is arranged in order.
For even count: average of two middle values.

Arranged: 5, 6, 6, 7, **8, 8**, 8, 9
Median = (7 + 8)/2 = **7.5**

### Mode
Most frequent value: **8** (appears 3 times)

### Range
Largest − smallest = 9 − 5 = **4**

---

## Frequency Tables and Histograms
A histogram displays frequency using bars where **area = frequency**.
- x-axis: class intervals
- y-axis: frequency density = frequency ÷ class width

---

## Cumulative Frequency
Cumulative frequency = running total of frequencies.
The **ogive** (S-curve) allows us to find:
- **Median** = value at n/2
- **Lower quartile (Q₁)** = value at n/4
- **Upper quartile (Q₃)** = value at 3n/4
- **Interquartile range = Q₃ − Q₁**

---

## Probability
$$P(E) = \\frac{\\text{Number of favourable outcomes}}{\\text{Total possible outcomes}}$$

0 ≤ P(E) ≤ 1

### Combined Events
- P(A and B) — both occur (independent): P(A) × P(B)
- P(A or B) — at least one occurs: P(A) + P(B) − P(A and B)
- P(not A) = 1 − P(A)

**Example:** A bag has 4 red, 3 blue, 5 green balls. One ball is drawn at random.
P(red) = 4/12 = **⅓**
P(not green) = 7/12
`,
    },
    {
      title: 'Matrices, Transformations and Vectors',
      type: 'text' as const,
      content: `# Matrices, Transformations and Vectors

## Learning Objectives
- Add, subtract and multiply matrices
- Use transformation matrices
- Add vectors and find magnitudes

---

## Matrix Operations

### Addition and Subtraction
Add corresponding elements.

$$\\begin{pmatrix} 2 & 3 \\\\ 1 & 4 \\end{pmatrix} + \\begin{pmatrix} 5 & 1 \\\\ 2 & 3 \\end{pmatrix} = \\begin{pmatrix} 7 & 4 \\\\ 3 & 7 \\end{pmatrix}$$

### Multiplication
Multiply rows by columns.

$$\\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix} \\times \\begin{pmatrix} 1 & 2 \\\\ 3 & 0 \\end{pmatrix} = \\begin{pmatrix} 5 & 4 \\\\ 15 & 6 \\end{pmatrix}$$

### Inverse of a 2×2 Matrix
If M = [[a,b],[c,d]], then M⁻¹ = (1/det) × [[d,−b],[−c,a]]
where det M = ad − bc.

---

## Transformation Matrices

| Transformation | Matrix |
|---------------|--------|
| Reflection in x-axis | [[1,0],[0,−1]] |
| Reflection in y-axis | [[−1,0],[0,1]] |
| Reflection in y = x | [[0,1],[1,0]] |
| Rotation 90° clockwise | [[0,1],[−1,0]] |
| Rotation 90° anti-clockwise | [[0,−1],[1,0]] |
| Rotation 180° | [[−1,0],[0,−1]] |
| Enlargement scale factor k | [[k,0],[0,k]] |

---

## Vectors

A vector has **magnitude** and **direction**.

Column vector: $\\vec{AB} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}$

**Magnitude:** $|\\vec{AB}| = \\sqrt{x^2 + y^2}$

**Example:** $\\vec{v} = \\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix}$, |v| = √(9 + 16) = √25 = **5**

### Vector Path Problems
If OA = a and OB = b:
- AB = b − a
- Midpoint M of AB: OM = ½(a + b)
- If M divides AB in ratio 2:1: OM = a + ⅔(b − a)
`,
    },
  ],
}
