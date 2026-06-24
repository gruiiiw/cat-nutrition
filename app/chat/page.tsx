'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

// ── Types ─────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProductResult {
  id: number;
  name: string;
  brandName: string;
  foodType: string;
  texture: string | null;
  flavor: string | null;
  lifeStage: string | null;
  dmbProteinPct: number | null;
  dmbFatPct: number | null;
  dmbCarbPct: number | null;
  dmbFiberPct: number | null;
  caloriesPerOz: number | null;
  score: number;
  prices: {
    retailer: string;
    price: number;
    pricePerOz: number | null;
    url: string;
    inStock: boolean;
  }[];
  topIngredients: string[];
  recallCount: number;
}

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductResult[];
  profile?: Record<string, unknown> | null;
}

// ── Greeting ──────────────────────────────────────────────────────────────

const GREETING: DisplayMessage = {
  role: 'assistant',
  content:
    "Hi! Tell me about your cat and what you're looking for. You can describe anything — their age, weight, health issues, foods they've tried, your budget — and I'll find the best matches.",
};

// ── Suggested prompts ─────────────────────────────────────────────────────

const SUGGESTIONS = [
  'I have an overweight indoor cat who needs to lose weight',
  "My kitten is 4 months old, what's good for her?",
  'High protein wet food under $1.50 a day, no chicken',
  'My senior cat has kidney disease',
];

// ── Component ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isLoading) return;

    // Add user message to display
    const userMessage: DisplayMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Build conversation history for the API (exclude greeting, include only role/content)
    const apiMessages: ChatMessage[] = [
      ...messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: messageText },
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: DisplayMessage = {
        role: 'assistant',
        content: data.message,
        products: data.products?.length > 0 ? data.products : undefined,
        profile: data.profile ?? undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex flex-1 flex-col">
        {/* Page header */}
        <div className="px-4 pt-12 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="AI Cat Nutritionist"
              subtitle="Describe your cat, their health, foods they've tried, and your budget. I'll find the best matches from the database."
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((msg, i) => (
              <div key={i}>
                <MessageBubble message={msg} />
                {/* Show product cards if present */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 ml-11 space-y-3">
                    {/* Diet variety disclaimer */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">A note on variety:</strong>{' '}
                      We recommend feeding your cat a rotation of different brands,
                      flavors, proteins, and textures. This helps prevent diet
                      fixation, ensures more complete nutrition, and makes
                      transitions easier if a food is ever recalled or
                      discontinued.{' '}
                      <Link href="/references" className="text-primary underline">
                        Learn more
                      </Link>
                    </div>
                    {/* Filter pills showing what was searched */}
                    {msg.profile && (
                      <FilterPills profile={msg.profile} />
                    )}
                    {msg.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                    <p className="text-sm text-muted-foreground">
                      Showing top {msg.products.length} matches. Want me to
                      adjust the filters, show more, or compare any of these?
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-4 w-4 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M6.5 2C4.01 2 2 4.01 2 6.5S4.01 11 6.5 11s4.5-2.01 4.5-4.5S8.99 2 6.5 2zm0 7C5.12 9 4 7.88 4 6.5S5.12 4 6.5 4 9 5.12 9 6.5 7.88 9 6.5 9zm10-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 16.5c0-1.5-3-2.5-5.5-2.5S1 15 1 16.5V19h11v-2.5zm6.5-1.5c-1.25 0-3.76.87-4.5 1.62V19h9v-2.5c0-1.5-3.25-2.5-4.5-2.5z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl border bg-card px-4 py-3">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:0ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:150ms]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Suggestions for first message */}
            {showSuggestions && (
              <div className="ml-11 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Try one of these
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-xl border bg-card px-3 py-2 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-secondary hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-end gap-3 rounded-2xl border bg-card px-4 py-2 shadow-sm transition-colors focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me about your cat..."
                rows={1}
                className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground/60">
              This is not veterinary advice. Always consult your vet for
              health-related decisions.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-4 w-4 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M6.5 2C4.01 2 2 4.01 2 6.5S4.01 11 6.5 11s4.5-2.01 4.5-4.5S8.99 2 6.5 2zm0 7C5.12 9 4 7.88 4 6.5S5.12 4 6.5 4 9 5.12 9 6.5 7.88 9 6.5 9zm10-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 16.5c0-1.5-3-2.5-5.5-2.5S1 15 1 16.5V19h11v-2.5zm6.5-1.5c-1.25 0-3.76.87-4.5 1.62V19h9v-2.5c0-1.5-3.25-2.5-4.5-2.5z" />
        </svg>
      </div>
      <div className="max-w-[85%] rounded-2xl border bg-card px-4 py-3 text-sm leading-relaxed">
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function FilterPills({ profile }: { profile: Record<string, unknown> }) {
  const pills: { label: string; color: string }[] = [];

  if (profile.ageYears != null) {
    const age = profile.ageYears as number;
    const stage =
      age < 1 ? 'Kitten' : age > 10 ? `Senior, ${age}yr` : `${age}yr old`;
    pills.push({ label: stage, color: 'bg-primary/10 text-primary' });
  }

  if (profile.weightLbs != null) {
    pills.push({
      label: `${profile.weightLbs} lbs`,
      color: 'bg-primary/10 text-primary',
    });
  }

  if (profile.indoorOutdoor) {
    pills.push({
      label: profile.indoorOutdoor as string,
      color: 'bg-primary/10 text-primary',
    });
  }

  if (profile.preferredProteins && (profile.preferredProteins as string[]).length > 0) {
    (profile.preferredProteins as string[]).forEach((p) =>
      pills.push({
        label: `Prefers ${p}`,
        color: 'bg-chart-4/10 text-chart-4',
      })
    );
  }

  if (profile.excludeIngredients && (profile.excludeIngredients as string[]).length > 0) {
    (profile.excludeIngredients as string[]).forEach((i) =>
      pills.push({
        label: `No ${i}`,
        color: 'bg-destructive/10 text-destructive',
      })
    );
  }

  if (profile.conditions && (profile.conditions as string[]).length > 0) {
    (profile.conditions as string[]).forEach((c) =>
      pills.push({
        label: (c as string).replace(/_/g, ' '),
        color: 'bg-chart-5/10 text-chart-5',
      })
    );
  }

  if (profile.maxBudgetPerDay != null) {
    pills.push({
      label: `Under $${profile.maxBudgetPerDay}/day`,
      color: 'bg-chart-2/10 text-chart-2',
    });
  }

  if (profile.foodType && profile.foodType !== 'both') {
    pills.push({
      label: profile.foodType as string,
      color: 'bg-primary/10 text-primary',
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pb-2">
      {pills.map((pill, i) => (
        <span
          key={i}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${pill.color}`}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: ProductResult }) {
  const lowestPrice =
    product.prices.length > 0
      ? Math.min(...product.prices.map((p) => p.price))
      : null;

  const scoreColor =
    product.score >= 85
      ? 'text-chart-4'
      : product.score >= 70
        ? 'text-chart-2'
        : 'text-muted-foreground';

  return (
    <Link
      href={`/product/${product.id}`}
      className="card-hover block rounded-2xl border bg-card p-4 transition-colors hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {product.brandName}
            </p>
            {product.recallCount > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                {product.recallCount} recall{product.recallCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="mt-0.5 font-semibold leading-tight">{product.name}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {product.dmbProteinPct != null && (
              <span>Protein {Math.round(product.dmbProteinPct)}% DMB</span>
            )}
            {product.dmbFatPct != null && (
              <span>Fat {Math.round(product.dmbFatPct)}%</span>
            )}
            {product.dmbCarbPct != null && (
              <span>Carb {Math.round(product.dmbCarbPct)}%</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${scoreColor}`}>{product.score}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            match
          </p>
        </div>
      </div>

      {/* Prices */}
      {product.prices.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {product.prices.slice(0, 4).map((price) => (
            <span
              key={price.retailer}
              className="rounded-lg bg-secondary px-2 py-1 text-xs text-secondary-foreground"
            >
              {price.retailer} ${price.price.toFixed(2)}
            </span>
          ))}
        </div>
      )}

      {/* Top ingredients */}
      {product.topIngredients.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Top ingredients:</span>{' '}
          {product.topIngredients.join(', ')}
        </p>
      )}
    </Link>
  );
}
