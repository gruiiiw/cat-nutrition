import CatQuiz from '@/components/CatQuiz';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: "Cat Food Quiz | Let's Feed Your Cat!",
  description:
    'Take our personalized cat food quiz to find the best nutrition match for your feline friend.',
};

export default function QuizPage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <PageHeader
            title="Cat Food Quiz"
            subtitle="Answer a few questions about your cat and we'll find the best food matches — personalized to their unique needs."
          />
          <div className="mt-10">
            <CatQuiz />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
