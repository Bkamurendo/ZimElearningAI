export const alevelPureMath = {
  subjectCode: 'AL-PMATH',
  title: 'A-Level Pure Mathematics — Calculus, Algebra and Functions',
  description: 'Covers functions, differentiation, integration, series, vectors and trigonometry for ZIMSEC A-Level Pure Mathematics.',
  lessons: [
    {
      title: 'Functions — Domain, Range and Composition',
      type: 'text' as const,
      content: `# Functions — Domain, Range and Composition

## Learning Objectives
- Define a function formally and identify domain and range
- Find composite and inverse functions
- Understand and apply function transformations

---

## Definition of a Function
A **function** f: A → B maps every element of the domain A to exactly **one** element in the codomain B.

**Domain:** set of all valid input values (x)
**Range (image):** set of all actual output values — f(x)
**Codomain:** set of all possible outputs (range ⊆ codomain)

---

## Types of Functions
- **One-to-one (injective):** each output corresponds to exactly one input
- **Onto (surjective):** every element of the codomain is mapped to
- **Bijective:** one-to-one AND onto — has an inverse

---

## Composite Functions
If f(x) and g(x) are functions:
**fg(x) = f(g(x))** — apply g first, then f

**Example:** f(x) = 2x + 1, g(x) = x²
fg(x) = f(g(x)) = f(x²) = 2x² + 1
gf(x) = g(f(x)) = g(2x + 1) = (2x + 1)²

Note: fg ≠ gf in general.

---

## Inverse Functions
The inverse f⁻¹ "undoes" f.
f⁻¹ exists only if f is **one-to-one**.

**Finding f⁻¹:**
1. Write y = f(x)
2. Rearrange to make x the subject
3. Replace x with f⁻¹(y), or swap x and y

**Example:** f(x) = (3x − 2)/5
y = (3x − 2)/5 → 5y = 3x − 2 → x = (5y + 2)/3
**f⁻¹(x) = (5x + 2)/3**

Key property: **ff⁻¹(x) = f⁻¹f(x) = x**
The graph of f⁻¹ is the **reflection of f in the line y = x**.

---

## Transformations of Functions

| Transformation | Effect |
|---------------|--------|
| f(x) + a | Translate up by a |
| f(x + a) | Translate left by a |
| −f(x) | Reflect in x-axis |
| f(−x) | Reflect in y-axis |
| af(x) | Stretch vertically, scale factor a |
| f(ax) | Stretch horizontally, scale factor 1/a |

**Example:** Describe the transformation from f(x) to f(2x) − 3.
- f(2x): horizontal stretch, scale factor ½
- −3: translate 3 units downward
`,
    },
    {
      title: 'Differentiation — Rules and Techniques',
      type: 'text' as const,
      content: `# Differentiation — Rules and Techniques

## Learning Objectives
- Apply the rules of differentiation to polynomials, trigonometric, exponential and logarithmic functions
- Use the chain rule, product rule and quotient rule
- Find equations of tangents and normals

---

## First Principles
The derivative from first principles:
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

---

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
| sin(ax) | a cos(ax) |
| cos(ax) | −a sin(ax) |

---

## The Chain Rule
For composite functions: **d/dx[f(g(x))] = f'(g(x)) · g'(x)**

Or using u-substitution: **dy/dx = dy/du · du/dx**

**Example:** y = (3x + 1)⁵
Let u = 3x + 1, so y = u⁵
dy/du = 5u⁴, du/dx = 3
**dy/dx = 5(3x + 1)⁴ × 3 = 15(3x + 1)⁴**

---

## The Product Rule
**d/dx[u·v] = u·(dv/dx) + v·(du/dx)**

**Example:** y = x²·sin x
dy/dx = x²·cos x + sin x·2x = **x²cos x + 2x sin x**

---

## The Quotient Rule
$$\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{v\\frac{du}{dx} - u\\frac{dv}{dx}}{v^2}$$

**Example:** y = sin x / x²
dy/dx = (x²·cos x − sin x·2x) / x⁴ = **(x cos x − 2 sin x) / x³**

---

## Tangents and Normals
At point (a, f(a)):
- **Gradient of tangent** = f'(a)
- **Tangent equation:** y − f(a) = f'(a)(x − a)
- **Normal** is perpendicular: gradient = −1/f'(a)

**Example:** Find the tangent to y = x³ − 2x at x = 2.
f(2) = 8 − 4 = 4; f'(x) = 3x² − 2; f'(2) = 10
**Tangent: y − 4 = 10(x − 2) → y = 10x − 16**
`,
    },
    {
      title: 'Applications of Differentiation',
      type: 'text' as const,
      content: `# Applications of Differentiation

## Learning Objectives
- Find and classify stationary points
- Solve optimisation problems
- Apply differentiation to rates of change
- Sketch curve features

---

## Stationary Points
At a stationary point, **dy/dx = 0**.

### Classification using the Second Derivative
- d²y/dx² > 0 → **minimum**
- d²y/dx² < 0 → **maximum**
- d²y/dx² = 0 → test fails (check sign of dy/dx either side — first derivative test)

**Example:** y = x³ − 3x² − 9x + 2
dy/dx = 3x² − 6x − 9 = 3(x + 1)(x − 3) = 0
x = −1 or x = 3

d²y/dx² = 6x − 6
At x = −1: d²y/dx² = −12 < 0 → **local maximum** at (−1, 7)
At x = 3: d²y/dx² = 12 > 0 → **local minimum** at (3, −25)

---

## Optimisation
**Strategy:**
1. Define variables and write an expression for the quantity to maximise/minimise
2. If two variables, use a constraint equation to eliminate one
3. Differentiate and set = 0
4. Verify it's the desired type (max or min)
5. Check endpoints if over a restricted domain

**Example:** A farmer has 100 m of fencing to enclose a rectangular paddock. Find maximum area.
Let length = l, width = w. Then 2l + 2w = 100 → l = 50 − w
A = lw = w(50 − w) = 50w − w²
dA/dw = 50 − 2w = 0 → **w = 25 m, l = 25 m**
Maximum area = 625 m²

---

## Connected Rates of Change
Using the chain rule: **dx/dt = dx/dy · dy/dt**

**Example:** The radius of a sphere increases at 0.5 cm/s. Find the rate of change of volume when r = 3 cm.
V = (4/3)πr³ → dV/dr = 4πr²
dV/dt = dV/dr · dr/dt = 4π(9)(0.5) = **18π cm³/s**

---

## Curve Sketching
To sketch y = f(x):
1. Find x-intercepts (y = 0) and y-intercept (x = 0)
2. Find stationary points and their nature
3. Find asymptotes (vertical where denominator = 0; horizontal by limit as x → ±∞)
4. Consider symmetry (even/odd functions)
5. Note behaviour as x → ±∞
`,
    },
    {
      title: 'Integration — Techniques and Applications',
      type: 'text' as const,
      content: `# Integration — Techniques and Applications

## Learning Objectives
- Apply standard integrals and integration techniques
- Use integration by substitution and by parts
- Calculate definite integrals and areas

---

## Standard Integrals

| f(x) | ∫f(x)dx |
|------|---------|
| xⁿ (n ≠ −1) | xⁿ⁺¹/(n+1) + C |
| 1/x | ln|x| + C |
| eˣ | eˣ + C |
| eᵃˣ | eᵃˣ/a + C |
| sin x | −cos x + C |
| cos x | sin x + C |
| sec²x | tan x + C |
| sin(ax) | −cos(ax)/a + C |
| cos(ax) | sin(ax)/a + C |

---

## Integration by Substitution
For integrals of the form ∫f(g(x))·g'(x) dx, let **u = g(x)**.

**Example:** ∫2x(x² + 1)⁴ dx
Let u = x² + 1 → du/dx = 2x → du = 2x dx
= ∫u⁴ du = u⁵/5 + C = **(x² + 1)⁵/5 + C**

---

## Integration by Parts
$$\\int u \\frac{dv}{dx} dx = uv - \\int v \\frac{du}{dx} dx$$

**LIATE rule** for choosing u: Logarithms, Inverse trig, Algebraic, Trig, Exponential.

**Example:** ∫x·eˣ dx
Let u = x, dv/dx = eˣ → du/dx = 1, v = eˣ
= x·eˣ − ∫eˣ·1 dx = **xeˣ − eˣ + C = eˣ(x − 1) + C**

---

## Definite Integrals and Area
$$\\int_a^b f(x)\\,dx = [F(x)]_a^b = F(b) - F(a)$$

**Area between curve and x-axis:**
If f(x) ≥ 0 for a ≤ x ≤ b: Area = ∫ₐᵇ f(x) dx

**Example:** Area under y = x² + 1 from x = 0 to x = 3.
∫₀³ (x² + 1) dx = [x³/3 + x]₀³ = (9 + 3) − 0 = **12 square units**

**Area between two curves:**
Area = ∫ₐᵇ [f(x) − g(x)] dx (when f(x) ≥ g(x))
`,
    },
    {
      title: 'Sequences, Series and Binomial Theorem',
      type: 'text' as const,
      content: `# Sequences, Series and the Binomial Theorem

## Learning Objectives
- Identify arithmetic and geometric sequences/series
- Find sums of finite and infinite series
- Apply the binomial theorem

---

## Arithmetic Sequences
Each term increases by a common difference d.

**nth term:** aₙ = a + (n − 1)d
**Sum of n terms:** Sₙ = n/2[2a + (n − 1)d] = n/2(a + l)

where a = first term, d = common difference, l = last term

**Example:** 5, 8, 11, 14, ... a = 5, d = 3
a₁₀ = 5 + 9(3) = **32**
S₁₀ = 10/2(5 + 32) = 5 × 37 = **185**

---

## Geometric Sequences
Each term is multiplied by a common ratio r.

**nth term:** aₙ = arⁿ⁻¹
**Sum of n terms:** Sₙ = a(1 − rⁿ)/(1 − r) for r ≠ 1

**Example:** 3, 6, 12, 24, ... a = 3, r = 2
a₇ = 3 × 2⁶ = **192**
S₇ = 3(1 − 2⁷)/(1 − 2) = 3(−127)/(−1) = **381**

---

## Sum to Infinity (Geometric)
If |r| < 1: **S∞ = a/(1 − r)**

**Example:** 16, 8, 4, 2, ... (a = 16, r = ½)
S∞ = 16/(1 − ½) = **32**

---

## The Binomial Theorem
$$(1+x)^n = \\sum_{r=0}^{n} \\binom{n}{r} x^r$$

$$(a+b)^n = \\sum_{r=0}^{n} \\binom{n}{r} a^{n-r} b^r$$

Where $\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$ (binomial coefficient)

**Example:** Expand (1 + 2x)⁴
= ⁴C₀(1)⁴(2x)⁰ + ⁴C₁(1)³(2x)¹ + ⁴C₂(1)²(2x)² + ⁴C₃(1)(2x)³ + ⁴C₄(2x)⁴
= 1 + 8x + 24x² + 32x³ + 16x⁴

---

## Using Binomial for Approximations
When |x| is small: (1 + x)ⁿ ≈ 1 + nx + n(n-1)x²/2 + ...

**Example:** Estimate (0.99)⁶ = (1 − 0.01)⁶ ≈ 1 − 0.06 + 0.0015 = **0.9415**
Actual: 0.94148... ✓
`,
    },
  ],
}
