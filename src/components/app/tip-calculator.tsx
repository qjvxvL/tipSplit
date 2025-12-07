"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DollarSign,
  Users,
  Percent,
  Plus,
  Trash2,
  Sparkles,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { runFairnessAnalysis } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalyzeFairnessOfTipOutput } from "@/ai/flows/analyze-fairness-of-tip";

type Individual = {
  id: number;
  name: string;
  contribution: string;
  relativeCost: number;
};

export default function TipCalculator() {
  const [bill, setBill] = useState("100");
  const [tipOption, setTipOption] = useState("18");
  const [customTip, setCustomTip] = useState("");
  const [people, setPeople] = useState("2");
  const [splitMode, setSplitMode] = useState<"equal" | "individual">("equal");
  const [individuals, setIndividuals] = useState<Individual[]>([]);

  const [analysisResult, setAnalysisResult] = useState<AnalyzeFairnessOfTipOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();

  const billAmount = useMemo(() => parseFloat(bill) || 0, [bill]);
  const tipPercentage = useMemo(() => (tipOption === "custom" ? parseFloat(customTip) || 0 : parseInt(tipOption, 10)), [tipOption, customTip]);
  const peopleCount = useMemo(() => parseInt(people, 10) || 1, [people]);

  const tipAmount = useMemo(() => billAmount * (tipPercentage / 100), [billAmount, tipPercentage]);
  const totalAmount = useMemo(() => billAmount + tipAmount, [billAmount, tipAmount]);

  const { amountPerPerson, totalCollected, remainingAmount } = useMemo(() => {
    if (splitMode === 'equal') {
      const perPerson = peopleCount > 0 ? totalAmount / peopleCount : 0;
      return { amountPerPerson: perPerson, totalCollected: totalAmount, remainingAmount: 0 };
    }
    const collected = individuals.reduce((acc, ind) => acc + (parseFloat(ind.contribution) || 0), 0);
    return { amountPerPerson: 0, totalCollected: collected, remainingAmount: totalAmount - collected };
  }, [splitMode, totalAmount, peopleCount, individuals]);

  useEffect(() => {
    if (splitMode === 'equal') {
      setIndividuals(
        Array.from({ length: peopleCount }, (_, i) => ({
          id: Date.now() + i,
          name: `Person ${i + 1}`,
          contribution: (totalAmount / peopleCount).toFixed(2),
          relativeCost: 1,
        }))
      );
    }
  }, [peopleCount, totalAmount, splitMode]);


  const handleModeChange = (checked: boolean) => {
    const newMode = checked ? 'individual' : 'equal';
    setSplitMode(newMode);
  };

  const addIndividual = () => {
    setIndividuals([
      ...individuals,
      { id: Date.now(), name: `Person ${individuals.length + 1}`, contribution: "0", relativeCost: 1 },
    ]);
  };

  const removeIndividual = (id: number) => {
    setIndividuals(individuals.filter((ind) => ind.id !== id));
  };

  const updateIndividual = (id: number, field: keyof Individual, value: string | number) => {
    setIndividuals(
      individuals.map((ind) => (ind.id === id ? { ...ind, [field]: value } : ind))
    );
  };

  const handleAnalyze = async () => {
    if (Math.abs(remainingAmount) > 0.01) {
      toast({
        variant: "destructive",
        title: "Contributions Mismatch",
        description: `The total contributions (${totalCollected.toFixed(2)}) do not match the total bill (${totalAmount.toFixed(2)}). Please adjust.`,
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await runFairnessAnalysis({
        totalBill: billAmount,
        tipPercentage,
        individualContributions: individuals.map(i => ({
          name: i.name,
          contribution: parseFloat(i.contribution) || 0,
          relativeCost: i.relativeCost
        })),
      });
      setAnalysisResult(result);
      setIsModalOpen(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="text-accent-foreground" />
                Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="bill">Total Bill</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="bill"
                  type="number"
                  placeholder="0.00"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="pl-10 text-lg"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="text-accent-foreground" />
                Tip Percentage
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["15", "18", "20", "25"].map((p) => (
                  <Button
                    key={p}
                    variant={tipOption === p ? "default" : "secondary"}
                    onClick={() => setTipOption(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Custom Tip %"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setTipOption("custom");
                  }}
                  onFocus={() => setTipOption("custom")}
                  className="pr-8"
                />
                 <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="shadow-lg">
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="text-accent-foreground" />
                  Split Details
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="split-mode" className={cn(splitMode === 'equal' && "text-primary")}>Equal</Label>
                  <Switch id="split-mode" checked={splitMode === 'individual'} onCheckedChange={handleModeChange} />
                  <Label htmlFor="split-mode" className={cn(splitMode === 'individual' && "text-primary")}>Individual</Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
               {splitMode === 'equal' && (
                 <>
                   <Label htmlFor="people">Number of People</Label>
                   <div className="relative mt-2">
                     <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Input
                       id="people"
                       type="number"
                       min="1"
                       value={people}
                       onChange={(e) => setPeople(e.target.value)}
                       className="pl-10 text-lg"
                     />
                   </div>
                 </>
               )}
                {splitMode === 'individual' && (
                   <p className="text-sm text-muted-foreground">Adjust each person's contribution below. You can also add an estimate of their service usage for the fairness analysis.</p>
                )}
            </CardContent>
          </Card>

          <Card className="bg-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-lg">
              <div className="flex justify-between font-medium">
                <span>Tip Amount</span>
                <span className="font-bold">{formatCurrency(tipAmount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Bill</span>
                <span className="font-bold">{formatCurrency(totalAmount)}</span>
              </div>
              {splitMode === 'equal' && (
                <div className="flex justify-between text-xl font-bold text-primary-foreground bg-primary p-3 rounded-md">
                  <span>Per Person</span>
                  <span>{formatCurrency(amountPerPerson)}</span>
                </div>
              )}
               {splitMode === 'individual' && (
                 <>
                    <div className="flex justify-between font-medium">
                        <span>Total Collected</span>
                        <span className="font-bold">{formatCurrency(totalCollected)}</span>
                    </div>
                     <div className={cn("flex justify-between text-xl font-bold p-3 rounded-md", Math.abs(remainingAmount) < 0.01 ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-500/20 text-red-700 dark:text-red-400")}>
                        <span>{remainingAmount >= 0 ? 'Remaining' : 'Overpaid'}</span>
                        <span>{formatCurrency(Math.abs(remainingAmount))}</span>
                    </div>
                 </>
                
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      {splitMode === "individual" && (
        <Card className="mt-6 w-full shadow-lg">
          <CardHeader>
            <CardTitle>Individual Contributions</CardTitle>
            <CardDescription>
                Manually enter what each person is paying. The total must match the total bill including tip.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {individuals.map((ind, index) => (
                <div key={ind.id} className="grid grid-cols-12 gap-2 items-center animate-in fade-in">
                  <Input
                    placeholder={`Person ${index + 1}`}
                    value={ind.name}
                    onChange={(e) => updateIndividual(ind.id, "name", e.target.value)}
                    className="col-span-12 sm:col-span-4"
                  />
                  <div className="relative col-span-6 sm:col-span-3">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ind.contribution}
                      onChange={(e) => updateIndividual(ind.id, "contribution", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-4">
                      <Select
                        value={String(ind.relativeCost)}
                        onValueChange={(value) => updateIndividual(ind.id, "relativeCost", Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Service Use" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">Low</SelectItem>
                          <SelectItem value="1">Normal</SelectItem>
                          <SelectItem value="1.5">High</SelectItem>
                          <SelectItem value="2">Very High</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIndividual(ind.id)}
                      disabled={individuals.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <Button variant="outline" onClick={addIndividual}>
                <Plus className="mr-2 h-4 w-4" /> Add Person
            </Button>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || Math.abs(remainingAmount) > 0.01}>
              {isAnalyzing ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Analyze Fairness
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="text-primary"/>
              Fairness Analysis
            </DialogTitle>
            <DialogDescription>
              Here's what our AI thinks about this split, based on the contributions and service usage provided.
            </DialogDescription>
          </DialogHeader>
          {analysisResult && (
            <div className="space-y-4">
              <div className={cn("flex items-center gap-3 rounded-lg p-3", analysisResult.isFair ? "bg-green-500/20" : "bg-amber-500/20")}>
                {analysisResult.isFair ? <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" /> : <XCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                <p className="font-semibold">{analysisResult.isFair ? 'This split looks fair.' : 'This split might be unfair.'}</p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="explanation">
                  <AccordionTrigger>View Detailed Explanation</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {analysisResult.explanation}
                  </AccordionContent>
                </AccordionItem>
                {analysisResult.suggestedAdjustments && analysisResult.suggestedAdjustments.length > 0 && (
                  <AccordionItem value="adjustments">
                    <AccordionTrigger>Suggested Adjustments</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {analysisResult.suggestedAdjustments.map(adj => (
                          <li key={adj.name} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{adj.name}</span>
                            <span className={cn(adj.adjustment > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                              {adj.adjustment > 0 ? `receives ${formatCurrency(adj.adjustment)}` : `pays ${formatCurrency(Math.abs(adj.adjustment))}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
