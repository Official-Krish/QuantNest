import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "../ui/input";

export interface WorkflowNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowName: string;
  onChangeName: (value: string) => void;
  onSubmit: () => void;
}

export const WorkflowNameDialog = ({
  open,
  onOpenChange,
  workflowName,
  onChangeName,
  onSubmit,
}: WorkflowNameDialogProps) => {
  const handleSubmit = () => {
    if (workflowName.trim()) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 text-neutral-200 border border-neutral-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-neutral-100">Name your workflow</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Give your workflow a descriptive name to identify it later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={workflowName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="e.g., NIFTY Swing Trading Strategy"
            className="bg-neutral-800 text-neutral-200 placeholder-neutral-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!workflowName.trim()}
            className="px-4 py-2 ml-2 text-sm font-medium text-neutral-900 bg-neutral-100 rounded-lg hover:scale-103 disabled:opacity-50 transform transition duration-300 cursor-pointer"
          >
            Continue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};