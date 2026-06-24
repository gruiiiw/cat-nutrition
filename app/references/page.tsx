import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: "References | Let's Feed Your Cat!",
  description:
    'Sources and methodology behind the cat food nutrition analysis.',
};

export default function ReferencesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title="References &amp; Methodology"
            subtitle="Sources, formulas, and citations behind every calculation on this site.
            Please let me know if you notice that any information is incorrect."
          />

          <div className="mt-10 space-y-12">

            {/* ── 1. AAFCO ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">1. AAFCO Nutrient Profiles</h2>
              <p className="leading-relaxed text-muted-foreground">
                The Association of American Feed Control Officials (AAFCO)
                establishes nutrient profiles that define the minimum (and some
                maximum) nutrient levels for cat foods. These profiles serve as
                the basis for the AAFCO adequacy statement on every commercial
                pet food label sold in the United States and are updated
                periodically. The most recent revision is the{' '}
                <em>2024 AAFCO Official Publication</em>.
              </p>

              <div className="rounded-2xl border bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">Adult Maintenance</strong>{' '}
                  — minimum 26% crude protein, 9% crude fat (dry matter basis)
                </p>
                <p className="mt-1">
                  <strong className="text-foreground">Growth &amp; Reproduction</strong>{' '}
                  — minimum 30% crude protein, 9% crude fat (dry matter basis)
                </p>
                <p className="mt-3 text-xs">
                  Additional minimums are defined for amino acids (taurine ≥ 0.10% in
                  dry food / ≥ 0.20% in wet food), fatty acids (arachidonic acid, EPA,
                  DHA), vitamins, and minerals. Maximums are set for nutrients where
                  excess can be harmful (e.g., calcium, vitamin A, vitamin D).
                </p>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Sources:</p>
                <p>
                  AAFCO. <em>2024 AAFCO Official Publication</em>. Association of American
                  Feed Control Officials, 2024.{' '}
                  <a href="https://www.aafco.org/publications/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    aafco.org/publications
                  </a>
                </p>
                <p>
                  AAFCO. &quot;AAFCO Dog and Cat Food Nutrient Profiles.&quot;{' '}
                  <a href="https://www.aafco.org/nutritional-guidelines/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    aafco.org/nutritional-guidelines
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Updated Protein Research (2013)
                </p>
                <p className="mt-2">
                  While the AAFCO and NRC minimums above remain the regulatory
                  standard, more recent research suggests cats may need
                  significantly more protein than these minimums indicate. A 2013
                  study by Laflamme &amp; Hannah found that the minimum daily
                  protein requirement for adult cats is at least{' '}
                  <strong className="text-foreground">5.2 g per kilogram of body weight</strong>{' '}
                  equivalent to ~ 81 g per 1,000 kcal or about 32%
                  protein on a dry matter basis. This is notably higher than the
                  NRC&apos;s 2006 recommendation of 40 g per 1,000 kcal (26% DMB).
                </p>
                <p className="mt-2">
                  Many veterinary nutritionists now recommend a minimum protein
                  intake of 5–6 g per kilogram of body weight daily. For example,
                  a 4.5 kg (10-pound) cat would need at least 22.5–27 g of protein
                  daily. This aligns more closely with the protein content of a
                  wild feline diet, where approximately 50% of calories come from
                  protein.
                </p>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Laflamme, D.P. &amp; Hannah, S.S. &quot;Discrepancy Between Use of
                  Lean Body Mass or Nitrogen Balance to Determine Protein
                  Requirements for Adult Cats.&quot;{' '}
                  <em>Journal of Feline Medicine and Surgery</em>, vol. 15, no. 8,
                  2013, pp. 691–697.{' '}
                  <a href="https://pubmed.ncbi.nlm.nih.gov/23362342/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    PubMed 23362342
                  </a>
                </p>
                <p>
                  Barrington, K. &quot;How Much Protein Does My Cat Really
                  Need?&quot; <em>Cats.com</em>, updated March 2025.{' '}
                  <a href="https://cats.com/how-much-protein-does-a-cat-need" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    cats.com — Cat Protein Requirements
                  </a>
                </p>
              </div>
            </section>

            {/* ── 2. DMB ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">
                2. Dry Matter Basis (DMB) Calculation
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                Wet and dry foods contain vastly different amounts of moisture (wet
                food can be 75–85% water, while dry food is typically 6–10%). To
                compare nutrient content fairly, we convert all guaranteed
                analysis values to a dry matter basis using the standard formula:
              </p>
              <div className="rounded-2xl border bg-primary/5 p-5 font-mono text-sm">
                DMB % = (As-Fed Nutrient %) ÷ (100% − Moisture %) × 100
              </div>
              <p className="leading-relaxed text-muted-foreground">
                Estimated carbohydrate content (nitrogen-free extract, or NFE) is
                calculated as the remainder after subtracting all other
                guaranteed analysis components:
              </p>
              <div className="rounded-2xl border bg-primary/5 p-5 font-mono text-sm">
                NFE % = 100% − Protein% − Fat% − Fiber% − Ash% − Moisture%
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Sources:</p>
                <p>
                  National Research Council. <em>Nutrient Requirements of Dogs and Cats</em>.
                  Washington, DC: The National Academies Press, 2006, pp. 28–30.{' '}
                  <a href="https://nap.nationalacademies.org/catalog/10668/nutrient-requirements-of-dogs-and-cats" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    National Academies Press
                  </a>
                </p>
                <p>
                  Hand, M.S. et al. <em>Small Animal Clinical Nutrition</em>, 5th ed.
                  Mark Morris Institute, 2010, Ch. 5: &quot;Making Pet Foods at Home.&quot;
                </p>
              </div>
            </section>

            {/* ── 3. ME / Atwater ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">
                3. Metabolizable Energy (ME) Calculation
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                We estimate metabolizable energy distribution using the modified
                Atwater factors for pet food, which were adapted from the
                original human Atwater factors (4-9-4 kcal/g) to account for the
                lower digestibility typical of pet food ingredients:
              </p>
              <div className="rounded-2xl border bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">Protein:</strong> 3.5 kcal/g
                  &nbsp;&middot;&nbsp;
                  <strong className="text-foreground">Fat:</strong> 8.5 kcal/g
                  &nbsp;&middot;&nbsp;
                  <strong className="text-foreground">Carbohydrate:</strong> 3.5 kcal/g
                </p>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                These modified factors are recommended by the NRC (2006, Chapter
                11) and are used by both AAFCO and FEDIAF for regulatory energy
                labeling of pet foods. They provide a reasonable estimate when
                actual digestibility trial data is not available for a given
                product.
              </p>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Sources:</p>
                <p>
                  National Research Council. <em>Nutrient Requirements of Dogs and Cats</em>.
                  Washington, DC: The National Academies Press, 2006, Chapter 11:
                  &quot;Energy,&quot; pp. 354–370.{' '}
                  <a href="https://nap.nationalacademies.org/catalog/10668/nutrient-requirements-of-dogs-and-cats" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    National Academies Press
                  </a>
                </p>
                <p>
                  Hall, J.A. et al. &quot;Using Gross Energy Improves Metabolizable
                  Energy Predictive Equations for Pet Foods.&quot;{' '}
                  <em>PLOS ONE</em>, vol. 8, no. 1, 2013, e54405.{' '}
                  <a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0054405" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    PLOS ONE
                  </a>
                </p>
              </div>
            </section>

            {/* ── 4. Daily Calorie Estimation ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">4. Daily Calorie Estimation</h2>
              <p className="leading-relaxed text-muted-foreground">
                Our calorie calculator uses the NRC (2006) resting energy
                requirement (RER) formula as its foundation, then applies
                maintenance energy requirement (MER) multipliers based on the
                cat&apos;s life stage, activity level, and body condition.
              </p>

              <div className="rounded-2xl border bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Base Formula (RER):</p>
                <p className="mt-1 font-mono">
                  RER (kcal/day) = 70 × BW(kg)<sup>0.75</sup>
                </p>
                <p className="mt-1 text-xs">
                  For lean adult cats, the NRC also provides an alternative:
                  RER = 100 × BW(kg)<sup>0.67</sup>
                </p>
              </div>

              <div className="rounded-2xl border bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Body Condition Score (BCS) Adjustments:</p>
                <p className="mt-1">BCS 1–3 (underweight): ~30 kcal/lb — supports weight gain</p>
                <p>BCS 4–5 (ideal): ~25 kcal/lb — maintenance</p>
                <p>BCS 6–7 (overweight): ~22 kcal/lb — gradual weight loss</p>
                <p>BCS 8–9 (obese): ~20 kcal/lb — weight loss program</p>
                <p className="mt-2 text-xs">
                  The 9-point BCS scale was developed by Laflamme (1997) and is
                  recommended by the WSAVA Global Nutrition Committee. BCS 4–5 is
                  ideal (approx. 15–24% body fat), BCS 6–7 is overweight (25–34%),
                  and BCS 8–9 is obese (≥ 35% body fat).
                </p>
              </div>

              <div className="rounded-2xl border bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Maintenance Energy Requirement (MER) Multipliers:
                </p>
                <p className="mt-2">
                  The MER is calculated by multiplying the RER by a factor that
                  accounts for life stage, reproductive status, and activity level.
                  These multipliers come from the NRC (2006):
                </p>
                <div className="mt-3 space-y-1">
                  <p><strong className="text-foreground">Neutered adult cat:</strong> 1.2 × RER</p>
                  <p><strong className="text-foreground">Intact adult cat:</strong> 1.4 × RER</p>
                  <p><strong className="text-foreground">Inactive / obese-prone cat:</strong> 1.0 × RER</p>
                  <p><strong className="text-foreground">Active adult cat:</strong> 1.6 × RER</p>
                  <p><strong className="text-foreground">Kitten (4–12 months):</strong> 2.0 × RER</p>
                  <p><strong className="text-foreground">Kitten (weaning to 4 months):</strong> 2.5 × RER</p>
                  <p><strong className="text-foreground">Gestation:</strong> 1.6–2.0 × RER</p>
                  <p><strong className="text-foreground">Lactation:</strong> 2.0–6.0 × RER (depends on litter size)</p>
                  <p><strong className="text-foreground">Senior cat (11+ years):</strong> 1.1–1.4 × RER</p>
                  <p><strong className="text-foreground">Weight loss program:</strong> 0.8 × RER for ideal weight</p>
                  <p><strong className="text-foreground">Weight gain program:</strong> 1.2–1.8 × RER for ideal weight</p>
                </div>
                <p className="mt-3 text-xs">
                  &quot;Ideal weight&quot; refers to the estimated weight at BCS 5 on
                  the 9-point scale, not the cat&apos;s current weight. For
                  overweight cats, the multiplier is applied to the ideal body
                  weight to avoid overfeeding.
                </p>
              </div>

              <div className="rounded-2xl border bg-primary/5 p-5 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Additional Activity &amp; Environment Adjustments:</p>
                <div className="mt-2 space-y-1">
                  <p><strong className="text-foreground">Indoor-only cat:</strong> reduce by ~10% (lower activity)</p>
                  <p><strong className="text-foreground">Outdoor access:</strong> increase by 10–20% (seasonal/activity variation)</p>
                  <p><strong className="text-foreground">Multi-cat household (competitive feeding):</strong> monitor individually</p>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Sources:</p>
                <p>
                  National Research Council. <em>Nutrient Requirements of Dogs and
                  Cats</em>. Washington, DC: The National Academies Press, 2006,
                  Chapter 11: &quot;Energy,&quot; pp. 354–370, Table 11-3 (maintenance
                  energy requirements).{' '}
                  <a href="https://nap.nationalacademies.org/catalog/10668/nutrient-requirements-of-dogs-and-cats" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    National Academies Press
                  </a>
                </p>
                <p>
                  WSAVA Global Nutrition Committee. &quot;Calorie Needs for Cats.&quot;{' '}
                  <a href="https://wsava.org/wp-content/uploads/2020/01/Calorie-Needs-for-cats-updated-2020.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    WSAVA Calorie Needs PDF
                  </a>
                </p>
                <p>
                  Laflamme, D. &quot;Development and Validation of a Body Condition Score
                  System for Cats.&quot; <em>Feline Practice</em>, vol. 25, no. 5–6, 1997,
                  pp. 13–18.
                </p>
                <p>
                  WSAVA Global Nutrition Committee. &quot;Body Condition Score — Cat.&quot;{' '}
                  <a href="https://wsava.org/wp-content/uploads/2025/06/WSAVA_BCSCat_BCSCat_Nutrition_250612.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    WSAVA BCS Chart (PDF)
                  </a>
                </p>
                <p>
                  Merck Veterinary Manual. &quot;Nutritional Requirements and Related
                  Diseases of Small Animals.&quot;{' '}
                  <a href="https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/nutritional-requirements-and-related-diseases-of-small-animals" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Merck Vet Manual
                  </a>
                </p>
                <p>
                  Bjornvad, C.R. et al. &quot;Evaluation of a Nine-Point Body Condition
                  Scoring System in Physically Inactive Pet Cats.&quot;{' '}
                  <em>American Journal of Veterinary Research</em>, vol. 72, no. 4, 2011,
                  pp. 433–437.{' '}
                  <a href="https://pubmed.ncbi.nlm.nih.gov/21453142/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    PubMed 21453142
                  </a>
                </p>
              </div>
            </section>

            {/* ── 5. Recall Data ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">5. Recall Data</h2>
              <p className="leading-relaxed text-muted-foreground">
                Recall information is sourced from the openFDA food recall
                enforcement database, which provides public access to FDA
                enforcement reports including recalls, market withdrawals, and
                safety alerts for pet food products. Data is queried via the
                openFDA API and matched to brands in our database.
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Sources:</p>
                <p>
                  U.S. Food &amp; Drug Administration. openFDA API — Animal &amp;
                  Veterinary Adverse Event Reporting and Recall Enforcement.{' '}
                  <a href="https://open.fda.gov/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    open.fda.gov
                  </a>
                </p>
                <p>
                  FDA. &quot;Pet Food Recalls &amp; Withdrawals.&quot;{' '}
                  <a href="https://www.fda.gov/animal-veterinary/safety-health/recalls-withdrawals" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    fda.gov/animal-veterinary
                  </a>
                </p>
              </div>
            </section>

            {/* ── 6. Diet Variety ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">6. Diet Variety &amp; Rotation</h2>
              <p className="leading-relaxed text-muted-foreground">
                We recommend feeding your cat a rotation of different brands,
                flavors, protein sources, and textures. Rotating foods helps
                prevent diet fixation — a common issue where cats refuse to eat
                anything other than one specific product. If that product is
                ever recalled, reformulated, or discontinued, a fixated cat may
                resist eating alternatives, which can be dangerous. Variety also
                helps ensure broader nutritional coverage, since no single
                product is perfect, and exposes your cat to different textures
                and proteins that support digestive adaptability.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                When rotating foods, transition gradually over 3–5 days by
                mixing increasing amounts of the new food with the old to avoid
                digestive upset. Cats with sensitive stomachs may need longer
                transitions or should consult a veterinarian before changing
                diets.
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Sources:</p>
                <p>
                  Cornell University College of Veterinary Medicine — Feline
                  Health Center. &quot;Feeding Your Cat.&quot;{' '}
                  <a href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Cornell — Feeding Your Cat
                  </a>
                </p>
                <p>
                  Chewy Editorial. &quot;How to Feed a Cat a Rotational Diet
                  Safely.&quot;{' '}
                  <a href="https://www.chewy.com/education/cat/food-and-nutrition/how-to-feed-a-cat-a-rotational-diet" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Chewy — Rotational Diet Guide
                  </a>
                </p>
              </div>
            </section>

            {/* ── 7. Controversial Ingredients ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">
                7. Ingredients of Concern in Cat Food
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                The following ingredients are flagged in our database as
                potentially concerning. This does not mean every product
                containing them is harmful — concentration, source quality, and
                your individual cat&apos;s health all matter. Always consult your
                veterinarian before making dietary decisions based on ingredient
                lists alone.
              </p>

              {/* Carrageenan */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">Carrageenan</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Carrageenan is a seaweed-derived thickener and emulsifier
                  commonly used in wet/canned cat food to create a consistent
                  texture. While the FDA classifies food-grade carrageenan as
                  GRAS (generally recognized as safe), a body of animal research
                  has raised concerns about gastrointestinal inflammation.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A 2001 review by Dr. Joanne Tobacman in <em>Environmental
                  Health Perspectives</em> examined decades of animal studies and
                  found associations between carrageenan exposure and intestinal
                  ulcerations and neoplasms. The debate centers on whether
                  food-grade (undegraded) carrageenan can partially break down
                  into degraded carrageenan (poligeenan) in the acidic
                  environment of the stomach.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    Tobacman, J.K. &quot;Review of Harmful Gastrointestinal Effects
                    of Carrageenan in Animal Experiments.&quot;{' '}
                    <em>Environmental Health Perspectives</em>, vol. 109, no. 10,
                    2001, pp. 983–994.{' '}
                    <a href="https://pubmed.ncbi.nlm.nih.gov/11675262/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      PubMed 11675262
                    </a>
                  </p>
                  <p>
                    Cornucopia Institute. &quot;Carrageenan: New Studies Reinforce
                    Link to Inflammation, Cancer, and Diabetes.&quot;{' '}
                    <a href="https://www.cornucopia.org/CornucopiaAnalysisofCarrageenanHealthImpacts042612.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Cornucopia Institute Report (PDF)
                    </a>
                  </p>
                </div>
              </div>

              {/* BHA / BHT */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">BHA &amp; BHT (Synthetic Preservatives)</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Butylated hydroxyanisole (BHA) and butylated hydroxytoluene
                  (BHT) are synthetic antioxidants used to preserve fats and
                  oils in pet food. BHA is listed by the U.S. National Toxicology
                  Program as &quot;reasonably anticipated to be a human
                  carcinogen&quot; based on animal studies. BHT has been linked to
                  organ stress (liver and kidney) at high doses in animal models.
                  Safer alternatives include mixed tocopherols (vitamin E) and
                  rosemary extract.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    National Toxicology Program. <em>Report on Carcinogens</em>,
                    15th Edition. U.S. Department of Health and Human Services,
                    2021 — BHA listing.{' '}
                    <a href="https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      NTP Report on Carcinogens
                    </a>
                  </p>
                  <p>
                    EFSA FEEDAP Panel. &quot;Safety and Efficacy of BHA for Use in
                    Cats.&quot; <em>EFSA Journal</em>, 2021.{' '}
                    <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8290245/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      PMC 8290245
                    </a>
                  </p>
                </div>
              </div>

              {/* Ethoxyquin */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">Ethoxyquin</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ethoxyquin is a synthetic antioxidant originally registered as
                  a pesticide. It is commonly added to fish meal during
                  processing to prevent spoilage, meaning it can appear in cat
                  foods containing fish meal even if the pet food manufacturer
                  did not add it directly. The European Union permanently banned
                  ethoxyquin as a feed additive in 2022 (Regulation EU
                  2022/1375) after EFSA could not conclude on its safety and
                  found a metabolite (ethoxyquin quinone imine) to be possibly
                  genotoxic. In the U.S., the FDA limits ethoxyquin to 75 ppm in
                  pet food (voluntary) and 150 ppm by regulation.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    EFSA FEEDAP Panel. &quot;Safety and Efficacy of Ethoxyquin as a
                    Feed Additive for All Animal Species.&quot; <em>EFSA Journal</em>,
                    vol. 13, no. 11, 2015, 4272.{' '}
                    <a href="https://www.efsa.europa.eu/en/news/efsa-reassesses-safety-feed-additive-ethoxyquin" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      EFSA Reassessment
                    </a>
                  </p>
                  <p>
                    European Commission. Regulation (EU) 2022/1375, repealing the
                    authorization of ethoxyquin as a feed additive.{' '}
                    <a href="https://www.btsa.com/en/eu-bans-ethoxyquin/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      EU Ban Summary
                    </a>
                  </p>
                </div>
              </div>

              {/* Propylene Glycol */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">Propylene Glycol</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Propylene glycol is a humectant used in some semi-moist pet
                  foods to retain moisture. While considered safe for dogs, the
                  FDA banned propylene glycol from cat food in 1996 after
                  research demonstrated it causes Heinz body formation in feline
                  red blood cells, leading to hemolytic anemia. Diets containing
                  as little as 6–12% propylene glycol were shown to produce
                  Heinz bodies and decrease red blood cell survival in cats.
                  Cats with higher food intake (lactating queens, kittens) are at
                  greater risk.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    Christopher, M.M. et al. &quot;Contribution of Propylene
                    Glycol-Induced Heinz Body Formation to Anemia in Cats.&quot;{' '}
                    <em>Journal of the American Veterinary Medical Association</em>,
                    vol. 194, no. 8, 1989, pp. 1045–1056.{' '}
                    <a href="https://avmajournals.avma.org/view/journals/javma/194/8/javma.1989.194.08.1045.xml" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      JAVMA
                    </a>
                  </p>
                  <p>
                    U.S. FDA. 21 CFR 589.1001 — Propylene glycol in or on cat food
                    (prohibited).
                  </p>
                </div>
              </div>

              {/* Menadione */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">
                  Menadione Sodium Bisulfite (Vitamin K3)
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Menadione sodium bisulfite complex is a synthetic form of
                  vitamin K used in some pet foods as a supplement. Unlike
                  natural forms of vitamin K (K1 from plants, K2 from
                  fermentation), menadione (K3) has been associated with
                  potential toxicity to the liver, kidneys, and lungs at high
                  doses. The European Union has banned menadione from human food
                  supplements, though it remains permitted in animal feed. Many
                  premium cat food brands have moved to natural vitamin K sources
                  instead.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    National Institutes of Health. &quot;Vitamin K — Fact Sheet for
                    Health Professionals.&quot;{' '}
                    <a href="https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      NIH Office of Dietary Supplements
                    </a>
                  </p>
                </div>
              </div>

              {/* Artificial Colors */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">
                  Artificial Colors (Red 40, Yellow 5, Yellow 6, Blue 2)
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Artificial food dyes provide no nutritional value and exist
                  solely for visual appeal to human purchasers — cats cannot
                  perceive these color differences. Some synthetic dyes have
                  been linked to hypersensitivity reactions and behavioral
                  effects in research. The EU requires warning labels on foods
                  containing certain synthetic dyes. Several pet food brands have
                  removed artificial colors in response to consumer demand.
                </p>
              </div>

              {/* Corn, Wheat, Soy */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">
                  Corn, Wheat &amp; Soy as Primary Ingredients
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  While not inherently toxic, these plant-based ingredients are
                  common allergens for cats and are often used as inexpensive
                  fillers that increase carbohydrate content. Cats are obligate
                  carnivores with limited ability to digest plant carbohydrates
                  efficiently. High-carbohydrate diets have been associated with
                  obesity and may contribute to feline diabetes in predisposed
                  cats. These ingredients are most concerning when they appear as
                  the first or second ingredient on the label, indicating they
                  make up a significant portion of the food.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    Zoran, D.L. &quot;The Carnivore Connection to Nutrition in
                    Cats.&quot; <em>Journal of the American Veterinary Medical
                    Association</em>, vol. 221, no. 11, 2002, pp. 1559–1567.
                  </p>
                  <p>
                    Cornell University College of Veterinary Medicine. &quot;Feeding
                    Your Cat.&quot;{' '}
                    <a href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Cornell Feline Health Center
                    </a>
                  </p>
                </div>
              </div>

              {/* Meat By-Products */}
              <div className="rounded-2xl border p-5 space-y-2">
                <h3 className="font-bold text-foreground">
                  Meat By-Products &amp; By-Product Meals
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Meat by-products are defined by AAFCO as &quot;the
                  non-rendered, clean parts, other than meat, derived from
                  slaughtered mammals,&quot; including organs (liver, kidney,
                  heart), blood, bone, and stomach/intestine contents. While
                  some by-products (like liver) are highly nutritious, the vague
                  definition means quality can vary significantly between
                  manufacturers. Named by-products (e.g., &quot;chicken
                  by-products&quot;) are generally preferred over generic
                  &quot;meat by-products&quot; or &quot;animal by-product
                  meal&quot; because the protein source is identified.
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Sources:</p>
                  <p>
                    AAFCO. &quot;What Is in Pet Food — Pet Food Ingredients.&quot;{' '}
                    <a href="https://www.aafco.org/consumers/understanding-pet-food/what-is-in-pet-food/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      aafco.org — What Is in Pet Food
                    </a>
                  </p>
                  <p>
                    Tufts University Cummings Veterinary Medical Center.
                    &quot;Don&apos;t Be Tricked: 4 Pet Food Myths.&quot;{' '}
                    <a href="https://vetnutrition.tufts.edu/2016/01/important-information-you-could-be-misreading-on-the-pet-food-label/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Tufts Petfoodology
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* ── 8. Veterinary Nutrition Resources ── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">
                8. Veterinary Nutrition Resources
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">National Research Council (NRC)</strong>{' '}
                  — <em>Nutrient Requirements of Dogs and Cats</em>, 2006. The
                  definitive scientific reference for companion animal nutrition,
                  covering energy requirements, nutrient allowances, and
                  digestibility.{' '}
                  <a href="https://nap.nationalacademies.org/catalog/10668/nutrient-requirements-of-dogs-and-cats" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    National Academies Press
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">WSAVA Global Nutrition Committee</strong>{' '}
                  — Global Nutrition Guidelines, Body Condition Score charts, and
                  calorie calculation worksheets.{' '}
                  <a href="https://wsava.org/global-guidelines/global-nutrition-guidelines/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    WSAVA Nutrition Guidelines
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Tufts University — Petfoodology</strong>{' '}
                  — Evidence-based blog by board-certified veterinary
                  nutritionists covering ingredient myths, reading pet food
                  labels, and nutrition misconceptions.{' '}
                  <a href="https://vetnutrition.tufts.edu/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    vetnutrition.tufts.edu
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Cornell University — Feline Health Center</strong>{' '}
                  — Comprehensive feline nutrition resources from the College of
                  Veterinary Medicine.{' '}
                  <a href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Cornell Feline Health Center
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Merck Veterinary Manual</strong>{' '}
                  — &quot;Nutritional Requirements of Cats&quot; — clinical
                  reference covering energy, protein, fat, vitamin, and mineral
                  requirements.{' '}
                  <a href="https://www.merckvetmanual.com/cat-owners/routine-care-and-breeding-of-cats/nutrition-and-feeding-of-cats" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Merck Vet Manual — Cats
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">VCA Animal Hospitals</strong>{' '}
                  — Body Condition Scoring guides and general feline nutrition
                  resources.{' '}
                  <a href="https://vcahospitals.com/know-your-pet/body-condition-score-in-cats" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    VCA — BCS in Cats
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">American College of Veterinary Internal Medicine (ACVIM)</strong>{' '}
                  — Consensus statements on feline nutrition and diet-related
                  disease management.{' '}
                  <a href="https://www.acvim.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    acvim.org
                  </a>
                </p>
              </div>
            </section>

            {/* ── Disclaimer ── */}
            <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 space-y-2">
              <h2 className="text-base font-bold text-foreground">
                Important Note
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This site is for informational purposes only and is not a
                substitute for professional veterinary advice. The information
                above represents our best effort to cite reliable, peer-reviewed
                sources. Pet nutrition science evolves constantly — always
                consult your veterinarian before making changes to your
                cat&apos;s diet, especially if your cat has health conditions.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
