import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: "About | Let's Feed Your Cat!",
  description:
    'Learn about our mission to help cat owners make informed nutrition decisions.',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeader title="About Let's Feed Your Cat!" gradient />

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">Why?</h2>
            <p className="leading-relaxed text-muted-foreground">
              I got tired updating my excel sheet, comparing prices and ingredients, proteins every time I wanted to try a new food for my cats. 
              I also wanted to create something to make sure cats with allergies are able to find foods fitting their needs, and everybody can find
              food meeting their budget, while providing good nutrition for their cats. So the goal is to look past marketing and provide
              data-driven nutrition analysis to find the best food within your needs and budget.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">How I Get Data</h2>
            <p className="leading-relaxed text-muted-foreground">
              The product database is built from manufacturer websites, where I
              collect guaranteed analysis values, ingredient lists, AAFCO
              statements, and calorie content. I cross-reference this data with
              major retailers — Chewy, Amazon, PetSmart, and Petco — for
              current pricing and availability. Recall information is sourced
              from the openFDA database.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              I update the data regularly, but as product formulations and
              prices change frequently, please verify the food on the manufacturer&apos;s website.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">
              What Is Dry Matter Basis (DMB)?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Pet food labels show nutrient percentages &quot;as fed,&quot; which
              includes the water content. Wet food can be 78% water, while dry
              food might be only 10% water. This makes direct comparison
              misleading — a wet food with 10% protein as-fed might actually
              have more protein per unit of dry matter than a dry food with 25%
              protein.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Dry Matter Basis removes the water and shows nutrients as a
              percentage of the solid content. This is the only fair way to
              compare nutrition across wet, dry, and semi-moist foods.
            </p>
            <div className="rounded-2xl border bg-primary/5 p-5">
              <p className="text-sm font-bold text-primary">The DMB Formula</p>
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                DMB % = (As-Fed %) / (100% - Moisture %) x 100
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Example: A wet food with 10% protein and 78% moisture has a DMB
                protein of 10 / (100 - 78) x 100 = 45.5%
              </p>
            </div>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">About me</h2>
            <p className="leading-relaxed text-muted-foreground">
              This project was created by a cat lover who got frustrated trying
              to compare cat food nutrition labels. What started as a personal
              spreadsheet grew into this tool to help other cat owners navigate
              the overwhelming world of pet food.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
