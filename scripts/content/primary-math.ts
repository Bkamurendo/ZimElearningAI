export const primaryMath = {
  subjectCode: 'PRI-MATH',
  title: 'Primary Mathematics — Numbers, Operations & Fractions',
  description: 'Covers number sense, the four operations, fractions, decimals and percentages aligned with the ZIMSEC Primary Mathematics syllabus for Grades 3–7.',
  lessons: [
    {
      title: 'Place Value and the Number System',
      type: 'text' as const,
      content: `# Place Value and the Number System

## Learning Objectives
By the end of this lesson you will be able to:
- Identify the place value of each digit in a number up to millions
- Write numbers in expanded notation
- Compare and order whole numbers

---

## What is Place Value?
Every digit in a number has a **place** and a **value** based on that place.

| Place         | Value        |
|---------------|-------------|
| Ones          | 1           |
| Tens          | 10          |
| Hundreds      | 100         |
| Thousands     | 1 000       |
| Ten-thousands | 10 000      |
| Hundred-thousands | 100 000 |
| Millions      | 1 000 000   |

### Example
In the number **3 456 027**:
- 3 is in the **millions** place → value = 3 000 000
- 4 is in the **hundred-thousands** place → value = 400 000
- 5 is in the **ten-thousands** place → value = 50 000
- 6 is in the **thousands** place → value = 6 000
- 0 is in the **hundreds** place → value = 0
- 2 is in the **tens** place → value = 20
- 7 is in the **ones** place → value = 7

**Expanded notation:** 3 000 000 + 400 000 + 50 000 + 6 000 + 0 + 20 + 7

---

## Comparing and Ordering Numbers
To compare numbers, start from the **leftmost** (largest) place value.

**Example:** Compare 47 823 and 47 519
- Both have the same digits in the ten-thousands (4) and thousands (7) places
- Compare hundreds: 8 > 5, so **47 823 > 47 519**

**Ordering** (ascending): 47 519 ; 47 823 ; 48 001

---

## Activity
1. Write 2 508 734 in expanded notation.
2. What is the value of the digit 6 in 1 635 200?
3. Arrange in descending order: 98 401 ; 98 041 ; 98 410
`,
    },
    {
      title: 'Addition and Subtraction',
      type: 'text' as const,
      content: `# Addition and Subtraction

## Learning Objectives
- Add and subtract whole numbers up to 7 digits
- Use column addition and subtraction correctly
- Solve word problems involving addition and subtraction

---

## Column Addition
Always line up digits by place value.

**Example:** 45 678 + 23 954

\`\`\`
  4 5 6 7 8
+ 2 3 9 5 4
-----------
  6 9 6 3 2
\`\`\`

**Steps:**
1. Ones: 8 + 4 = 12 → write 2, carry 1
2. Tens: 7 + 5 + 1(carry) = 13 → write 3, carry 1
3. Hundreds: 6 + 9 + 1 = 16 → write 6, carry 1
4. Thousands: 5 + 3 + 1 = 9 → write 9
5. Ten-thousands: 4 + 2 = 6

**Answer: 69 632**

---

## Column Subtraction (Borrowing/Regrouping)
**Example:** 73 402 − 28 675

\`\`\`
  7 3 4 0 2
- 2 8 6 7 5
-----------
  4 4 7 2 7
\`\`\`

Work right to left, borrowing when necessary.

---

## Word Problems
**Example:** A school has 1 245 boys and 1 378 girls. How many pupils altogether?
**Solution:** 1 245 + 1 378 = **2 623 pupils**

**Example:** A farmer harvested 8 500 kg of maize. He sold 3 275 kg. How much remains?
**Solution:** 8 500 − 3 275 = **5 225 kg**

---

## Tips for Success
- Always estimate first to check your answer makes sense
- Check subtraction by adding the answer back to the smaller number
`,
    },
    {
      title: 'Multiplication — Methods and Times Tables',
      type: 'text' as const,
      content: `# Multiplication — Methods and Times Tables

## Learning Objectives
- Recall multiplication facts up to 12 × 12
- Use the long multiplication method
- Multiply by multiples of 10 and 100

---

## Times Tables (1–12)
Knowing your times tables by heart is essential!

**12 × table:**
| × | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|----|----|-----|
| **12** | 12 | 24 | 36 | 48 | 60 | 72 | 84 | 96 | 108 | 120 | 132 | 144 |

---

## Multiplying by 10, 100, 1000
- Multiply by **10** → add one zero: 47 × 10 = 470
- Multiply by **100** → add two zeros: 47 × 100 = 4 700
- Multiply by **1 000** → add three zeros: 47 × 1 000 = 47 000

---

## Long Multiplication
**Example:** 346 × 28

\`\`\`
    3 4 6
  ×   2 8
  -------
  2 7 6 8   (346 × 8)
+ 6 9 2 0   (346 × 20)
---------
  9 6 8 8
\`\`\`

**Step 1:** 346 × 8 = 2 768
**Step 2:** 346 × 20 = 6 920
**Step 3:** Add: 2 768 + 6 920 = **9 688**

---

## Word Problem
A bus carries 52 passengers. How many passengers in 24 trips?
52 × 24 = **1 248 passengers**
`,
    },
    {
      title: 'Division',
      type: 'text' as const,
      content: `# Division

## Learning Objectives
- Understand division as sharing and grouping
- Use short division and long division
- Interpret remainders in context

---

## Short Division
**Example:** 2 856 ÷ 6

\`\`\`
      4 7 6
   --------
6 | 2 8 5 6
\`\`\`

- 28 ÷ 6 = 4 remainder 4 → write 4, carry 4
- 45 ÷ 6 = 7 remainder 3 → write 7, carry 3
- 36 ÷ 6 = 6 → write 6

**Answer: 476**

---

## Long Division
**Example:** 7 392 ÷ 24

\`\`\`
      308
   ------
24 | 7392
     -72
     ---
      192
     -192
     ----
        0
\`\`\`

**Answer: 308**

---

## Interpreting Remainders
**Example:** 47 children need to travel by minibuses that hold 12 each. How many minibuses are needed?

47 ÷ 12 = 3 remainder 11

The remainder means 11 children still need transport, so **4 minibuses** are needed (not 3).

---

## Divisibility Rules
| Divisible by | Rule |
|---|---|
| 2 | Last digit is even |
| 3 | Sum of digits divisible by 3 |
| 5 | Last digit is 0 or 5 |
| 10 | Last digit is 0 |
`,
    },
    {
      title: 'Fractions, Decimals and Percentages',
      type: 'text' as const,
      content: `# Fractions, Decimals and Percentages

## Learning Objectives
- Understand fractions as parts of a whole
- Convert between fractions, decimals and percentages
- Add, subtract and compare fractions

---

## Fractions
A fraction has a **numerator** (top) and **denominator** (bottom).

**Example:** ¾ means 3 parts out of 4 equal parts.

### Equivalent Fractions
Multiply (or divide) numerator and denominator by the same number:
- ½ = 2/4 = 3/6 = 4/8

### Adding Fractions (same denominator)
¼ + 2/4 = 3/4

### Adding Fractions (different denominators)
½ + ⅓ = 3/6 + 2/6 = **5/6** ← find LCM first

---

## Decimals
Decimals are fractions with denominators of 10, 100, 1000, etc.

| Fraction | Decimal |
|----------|---------|
| 1/10 | 0.1 |
| 1/4 | 0.25 |
| 1/2 | 0.5 |
| 3/4 | 0.75 |

---

## Percentages
**Per cent** means "out of 100."

**Fraction → Percentage:** Multiply by 100
¾ × 100 = **75%**

**Percentage → Decimal:** Divide by 100
35% = 35 ÷ 100 = **0.35**

---

## Finding a Percentage of an Amount
**Example:** Find 30% of $450
= 30/100 × 450
= 0.30 × 450
= **$135**

---

## Summary Table
| Fraction | Decimal | Percentage |
|----------|---------|------------|
| 1/2 | 0.5 | 50% |
| 1/4 | 0.25 | 25% |
| 3/4 | 0.75 | 75% |
| 1/5 | 0.2 | 20% |
| 1/10 | 0.1 | 10% |
`,
    },
  ],
}
