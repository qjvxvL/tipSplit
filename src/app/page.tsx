import TipCalculator from "@/components/app/tip-calculator";
import { Receipt } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3">
            <Receipt className="h-10 w-10 text-primary" />
            <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              TipSplit
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Easily calculate tips and split bills with friends. Ensure everyone pays their fair share, with a little help from AI.
          </p>
        </header>
        <TipCalculator />
      </div>
    </main>
  );
}
