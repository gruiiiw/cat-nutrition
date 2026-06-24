import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: "Disclaimer | Let's Feed Your Cat!",
  description:
    'Important disclaimers about veterinary advice, data accuracy, and affiliate links.',
};

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeader title="Disclaimer" />

          <div className="mt-10 space-y-8">
            {[
              {
                title: 'Not Veterinary Advice',
                body: "The information provided on this website is for general informational purposes only. It is not intended as, and should not be considered, veterinary advice. Always consult a qualified veterinarian regarding your cat's specific dietary needs, health conditions, and nutritional requirements. Do not make changes to your cat's diet based solely on information from this website.",
              },
              {
                title: 'Consult Your Veterinarian',
                body: 'Every cat is unique. Factors such as breed, age, weight, health conditions, medications, and individual metabolism all affect nutritional needs. A veterinarian who knows your cat can provide personalized dietary recommendations that account for these individual factors. If your cat has any health conditions (diabetes, kidney disease, urinary issues, food allergies, IBD, hyperthyroidism, or others), professional veterinary guidance is especially important.',
              },
              {
                title: 'Affiliate Link Disclosure',
                body: 'This website contains affiliate links to retailers including Chewy, Amazon, PetSmart, and Petco. When you click on these links and make a purchase, we may receive a small commission at no additional cost to you. These commissions help support the operation and maintenance of this website. Affiliate relationships do not influence our product rankings, recommendations, or nutritional analysis in any way.',
              },
              {
                title: 'Data Accuracy',
                body: "We make our best effort to provide accurate and up-to-date product information, including nutritional analysis, ingredient lists, pricing, and recall data. However, we cannot guarantee 100% accuracy or currency of all information. Product formulations change, prices fluctuate, and manufacturer data may contain errors. Always verify critical nutritional information directly from the product label or manufacturer's website before making purchasing decisions.",
              },
              {
                title: 'Brand Independence',
                body: 'This website is not affiliated with, endorsed by, or sponsored by any pet food brand, manufacturer, or retailer. All product analysis is conducted independently. Brand names and product names are trademarks of their respective owners and are used here solely for identification and informational purposes.',
              },
            ].map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
