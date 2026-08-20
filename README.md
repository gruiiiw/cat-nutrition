## Cat Nutritionist | Cat Nutrition Advisor App

Conducted product discovery across cat owner forums, veterinary literature, and competitor analysis to define core user needs; prioritized the product roadmap across four workstreams: guided questionnaire, allergen engine, data scraping pipeline, and affiliate monetization.

Integrated a conversational AI nutritionist (Claude Haiku API) that parses natural-language descriptions of a cat's profile into structured filter parameters, enabling non-technical users to get personalized food recommendations through free-form chat.

Designed two complementary user flows — a guided questionnaire (body condition scoring, health conditions, ingredient allergies, budget) and a quick-browse mode — to serve both first-time and returning users with different intent levels.

Architected a PostgreSQL schema with 9 relational tables covering products, ingredients (12-category allergen-aware classification), multi-retailer pricing, and FDA recall history; built a protein-forward scoring algorithm grounded in peer-reviewed nutritional research (Laflamme & Hannah, 2013).

Built an automated weekly data pipeline (Python/Playwright) scraping manufacturer sites and four retailers, feeding a nutritional analysis backend that computes dry-matter-basis and metabolizable-energy percentages for cross-product comparison.

Stack: Next.js, TypeScript, Tailwind CSS, PostgreSQL (Supabase), Prisma, Claude API, Python, Vercel

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
