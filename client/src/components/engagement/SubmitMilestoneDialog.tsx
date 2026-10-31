import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import depositService from "@/services/depositService";
import { Engagement } from "@/types/deposit";
import { Loader2, AlertCircle, Paperclip, X, Plus, FileText, Image, Archive } from "lucide-react";

interface SubmitMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagement: Engagement;
  milestone: any;
  milestoneNumber: number;
  onSuccess: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/zip",
  "application/x-zip-compressed",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (type.includes("zip")) return <Archive className="h-4 w-4 text-yellow-600" />;
  return <FileText className="h-4 w-4 text-slate-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SubmitMilestoneDialog({
  open,
  onOpenChange,
  engagement,
  milestone,
  milestoneNumber,
  onSuccess,
}: SubmitMilestoneDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([""]);

  // ── File selection ──────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: "Unsupported File Type", description: `"${file.name}" is not a supported file type.`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File Too Large", description: `"${file.name}" exceeds the 5 MB limit.`, variant: "destructive" });
        continue;
      }
      valid.push(file);
    }
    setAttachedFiles((prev) => [...prev, ...valid]);
    // reset input so the same file can be re-selected
    e.target.value = "";
  };

  const removeFile = (index: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));

  // ── URL entries ──────────────────────────────────────────────────
  const addUrlField = () => setFileUrls((prev) => [...prev, ""]);
  const updateUrl = (index: number, value: string) =>
    setFileUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  const removeUrl = (index: number) =>
    setFileUrls((prev) => prev.filter((_, i) => i !== index));

  // ── Reset state on close ─────────────────────────────────────────
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setContent("");
      setAttachedFiles([]);
      setFileUrls([""]);
    }
    onOpenChange(open);
  };

  // ── Submit ────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Collect valid URL strings
      const validUrls = fileUrls.map((u) => u.trim()).filter(Boolean);

      // For actual file uploads, convert to data URLs as a simple passthrough
      // (In a production setup, you'd upload to S3/Cloudinary first and collect returned URLs)
      const fileDataUrls: string[] = await Promise.all(
        attachedFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const res = reader.result as string;
                const withName = res.replace(
                  /^(data:[^;]+);base64,/,
                  `$1;name=${encodeURIComponent(file.name)};base64,`
                );
                resolve(withName);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      const allFiles = [...validUrls, ...fileDataUrls];

      return depositService.submitMilestone({
        engagementId: engagement._id,
        quotationId: engagement.quotationId,
        milestoneNumber,
        submissionContent: content.trim(),
        submissionFiles: allFiles,
      });
    },
    onSuccess: () => {
      toast({
        title: "Milestone Submitted",
        description: "Your milestone submission has been sent for review.",
      });
      handleOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({ title: "Validation Error", description: "Please describe what was delivered in this milestone.", variant: "destructive" });
      return;
    }
    if (content.trim().length < 20) {
      toast({ title: "Validation Error", description: "Completion note must be at least 20 characters.", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const isPending = submitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Submit Milestone {milestoneNumber}</DialogTitle>
          <DialogDescription>{milestone.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Milestone Details */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-1">Milestone Scope</p>
            <p className="text-sm text-muted-foreground">{milestone.scope}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deposit Amount:</span>
              <span className="font-bold">{depositService.formatDeposit(milestone.depositAmount)}</span>
            </div>
          </div>

          {/* Submission Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Submission Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Describe what was delivered in this milestone..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">Provide a detailed description of the work completed</p>
          </div>

          {/* Supporting Attachments */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">Supporting Attachments</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Attach invoices, deliverables, reports, designs, documents, or other project-related files that support your milestone submission.
              </p>
            </div>

            {/* Drop zone / attach button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5 rounded-xl py-6 px-4 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip className="h-6 w-6 text-slate-400" />
              <span className="text-sm font-semibold text-slate-600">📎 Attach Files</span>
              <span className="text-xs text-muted-foreground">Click to browse files</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileSelect}
              disabled={isPending}
            />

            {/* Attached file list */}
            {attachedFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-1">No files attached yet</p>
            ) : (
              <div className="space-y-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.type)}
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[260px]">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">Or add file links</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* URL fields */}
            <div className="space-y-2">
              {fileUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    value={url}
                    onChange={(e) => updateUrl(idx, e.target.value)}
                    disabled={isPending}
                    className="text-sm"
                  />
                  {fileUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrl(idx)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUrlField}
                disabled={isPending}
                className="text-xs gap-1.5 h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Add File URL
              </Button>
            </div>

            {/* File types note */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 space-y-0.5">
              <p className="text-xs font-semibold text-slate-600">File types</p>
              <p className="text-xs text-muted-foreground">Supported: PDF, DOCX, XLSX, PPTX, JPG, PNG, ZIP and more.</p>
              <p className="text-xs text-muted-foreground">Maximum file size: <span className="font-semibold">5 MB</span> per file.</p>
            </div>
          </div>

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Once submitted, the business will review your milestone completion. They can approve, request revisions, or flag issues.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Milestone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
