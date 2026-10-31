import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, X, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { searchService } from "@/services/searchService";
import { toast } from "sonner";

interface DescribeRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: any) => void;
}

const ROTATING_PLACEHOLDERS = [
  "e.g., We're getting website traffic, but not enough qualified leads…",
  "e.g., Launching a new product, but unsure how to take it to market…",
  "e.g., Our brand looks different across every channel…",
  "e.g., We're spending on ads, but conversions are too low…",
  "e.g., We need to grow, but aren't sure which marketing channels to focus on…",
  "e.g., Our website gets visitors, but they aren't becoming customers…",
  "e.g., Our sales team needs better marketing materials…",
  "e.g., We have a good product, but our positioning isn't resonating with customers…",
] as const;

const COMMON_CHALLENGES = [
  "Not getting enough qualified leads",
  "Website traffic isn't converting",
  "Brand feels unclear or inconsistent",
  "Ads aren't delivering enough conversions",
  "Don't know which channels to focus on",
  "Launching a new product",
  "Need stronger sales & marketing materials",
  "Struggling to reach the right customers",
] as const;

export const DescribeRequirementModal: React.FC<DescribeRequirementModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [challengePairIdx, setChallengePairIdx] = useState(0);
  const [clarificationPrompt, setClarificationPrompt] = useState<string | null>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [mappedFilters, setMappedFilters] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholders every 3 seconds if query is empty
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Rotate common challenges 2 at a time dynamically
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setChallengePairIdx((prev) => (prev + 1) % (COMMON_CHALLENGES.length / 2));
    }, 4000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Lock body scroll and focus input when modal is opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => textareaRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = "";
      setClarificationPrompt(null);
      setClarificationAnswer("");
      setSearchQuery("");
      setIsSearching(false);
      setMappedFilters(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateWithFilters = (filters: any) => {
    onClose();
    if (onApplyFilters) {
      onApplyFilters(filters);
    }

    const params = new URLSearchParams();
    if (filters.serviceHead) {
      params.set("category", filters.serviceHead);
    }
    if (filters.primaryFilters && filters.primaryFilters.length > 0) {
      params.set("focus", filters.primaryFilters[0]);
    }
    if (filters.subFilters && filters.subFilters.length > 0) {
      params.set("need", filters.subFilters.join(","));
    }
    if (filters.industry && filters.industry.length > 0) {
      params.set("industry", filters.industry.join(","));
    }
    if (filters.mumbaiRegion && filters.mumbaiRegion.length > 0) {
      params.set("location", filters.mumbaiRegion[0]);
    }
    if (filters.operationalModel && filters.operationalModel.length > 0) {
      params.set("opModel", filters.operationalModel[0]);
    }
    params.set("search", "true");

    navigate(`/experts?${params.toString()}`);
  };

  const executeSearch = async (queryText: string) => {
    const text = queryText.trim() || ROTATING_PLACEHOLDERS[placeholderIdx];
    if (!text) return;

    setIsSearching(true);
    setClarificationPrompt(null);
    setClarificationAnswer("");

    try {
      const response = await searchService.mapNaturalLanguageQuery(text);
      if (response.success && response.filters) {
        setMappedFilters(response.filters);
        if (response.missingInfoPrompt) {
          setClarificationPrompt(response.missingInfoPrompt);
        } else {
          navigateWithFilters(response.filters);
        }
      } else {
        onClose();
        navigate(`/experts?keyword=${encodeURIComponent(text)}&search=true`);
      }
    } catch (err: any) {
      console.error("[DescribeRequirementModal] Error mapping query:", err);
      toast.error("Could not analyze requirement. Searching by keyword instead.");
      onClose();
      navigate(`/experts?keyword=${encodeURIComponent(text)}&search=true`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim() || !mappedFilters) return;
    setIsSearching(true);
    const combinedQuery = `${searchQuery}. Clarification: ${clarificationAnswer}`;
    setClarificationPrompt(null);

    try {
      const response = await searchService.mapNaturalLanguageQuery(combinedQuery);
      if (response.success && response.filters) {
        navigateWithFilters(response.filters);
      } else {
        navigateWithFilters(mappedFilters);
      }
    } catch (err) {
      navigateWithFilters(mappedFilters);
    } finally {
      setIsSearching(false);
      setClarificationAnswer("");
    }
  };

  const skipClarification = () => {
    if (mappedFilters) {
      navigateWithFilters(mappedFilters);
    } else {
      onClose();
      navigate(`/experts?keyword=${encodeURIComponent(searchQuery || ROTATING_PLACEHOLDERS[placeholderIdx])}&search=true`);
    }
    setClarificationPrompt(null);
    setClarificationAnswer("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[620px] bg-white rounded-3xl border border-border/80 shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11.5px] font-semibold text-primary font-poppins">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Requirement-First AI Match
              </div>
              <h2 className="text-[20px] sm:text-[24px] font-bold font-poppins text-ink tracking-tight">
                Tell Us What You Need Help With
              </h2>
              <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed">
                Tell us what you're trying to solve. We'll find the right marketing expert.
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-ink-soft hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form / Clarification Area */}
          {!clarificationPrompt ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative rounded-2xl border-2 border-border/70 bg-white p-3.5 transition-all duration-200 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10 shadow-xs">
                <textarea
                  ref={textareaRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                      e.preventDefault();
                      executeSearch(searchQuery);
                    }
                  }}
                  disabled={isSearching}
                  rows={3}
                  className="w-full resize-none bg-transparent text-[14.5px] text-ink placeholder:text-ink-soft/60 focus:outline-none leading-relaxed font-sans"
                  placeholder={ROTATING_PLACEHOLDERS[placeholderIdx]}
                />

                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[11.5px] text-ink-soft">
                  <span className="hidden sm:inline-flex items-center gap-1">
                    Press <CornerDownLeft className="w-3 h-3 text-ink/40" /> Enter to search
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery(ROTATING_PLACEHOLDERS[placeholderIdx])}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Use suggested example
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-[13px] font-bold font-poppins text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[13.5px] font-bold font-poppins text-white shadow-md hover:bg-primary/95 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Finding re-Solution</span>
                    </>
                  ) : (
                    <>
                      <span>Find Matching Experts</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Common Challenges (rotating 2 at a time dynamically) */}
              <div className="pt-2 text-left space-y-2">
                <span className="text-[12px] font-semibold text-ink-soft uppercase tracking-wider block">
                  Common challenges:
                </span>
                <div className="flex flex-wrap gap-2 transition-all duration-500 animate-in fade-in min-h-[34px]">
                  {[
                    COMMON_CHALLENGES[challengePairIdx * 2],
                    COMMON_CHALLENGES[challengePairIdx * 2 + 1],
                  ].filter(Boolean).map((challenge) => (
                    <button
                      key={challenge}
                      type="button"
                      onClick={() => {
                        setSearchQuery(challenge);
                        executeSearch(challenge);
                      }}
                      disabled={isSearching}
                      className="rounded-full border border-border/80 bg-[#FAF8F5] px-3.5 py-1.5 text-[12px] font-medium text-ink hover:border-primary/40 hover:bg-white hover:text-primary transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      {challenge}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* Clarification Step */
            <div className="space-y-4 text-left animate-in fade-in duration-200">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="w-3.5 h-3.5" /> Narrow Your Focus
                </span>
                <p className="text-[14px] font-semibold text-ink leading-relaxed">
                  {clarificationPrompt}
                </p>
              </div>

              <input
                type="text"
                value={clarificationAnswer}
                onChange={(e) => setClarificationAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && clarificationAnswer.trim()) {
                    handleClarificationSubmit();
                  }
                }}
                className="w-full h-12 border-2 border-border/80 bg-white px-4 rounded-xl text-[14px] text-ink focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 shadow-xs"
                placeholder="Type clarification here (e.g. 'We need branding and a new logo design')..."
                autoFocus
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={skipClarification}
                  className="px-4 py-2 text-[13px] font-bold font-poppins text-ink-soft hover:text-ink transition-colors cursor-pointer"
                >
                  Skip &amp; Search
                </button>
                <button
                  type="button"
                  onClick={handleClarificationSubmit}
                  disabled={!clarificationAnswer.trim() || isSearching}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold font-poppins text-white transition-colors hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Finding re-Solution</span>
                    </>
                  ) : (
                    <>
                      <span>Refine Search</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
