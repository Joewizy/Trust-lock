'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AcknowledgementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRaise: () => Promise<void>;
  isLoading?: boolean;
  status?: string;
  error?: string;
}

const rules = [
  'All contributed funds are held in escrow until a milestone is approved by contributors.',
  'No individual can override milestone outcomes, voting results, or protocol rules.',
  'If milestones fail, contributors can reclaim refundable funds automatically.',
];

export function AcknowledgementModal({
  open,
  onOpenChange,
  onCreateRaise,
  isLoading = false,
  status = '',
  error = '',
}: AcknowledgementModalProps) {
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setAcknowledged(false);
      setIsCreating(false);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!acknowledged) return;
    
    setIsCreating(true);
    try {
      await onCreateRaise();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Your Raise</DialogTitle>
          <DialogDescription>
            Please review and acknowledge the following terms before creating your raise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Milestone Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Milestones can be created and managed after your raise reaches its funding goal.
            </AlertDescription>
          </Alert>

          {/* Acknowledgement Rules */}
          <div className="space-y-3">
            <h4 className="font-medium">Protocol Terms & Conditions</h4>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Single Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acknowledge-all"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              disabled={isCreating}
            />
            <label
              htmlFor="acknowledge-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to all terms and conditions
            </label>
          </div>

          {/* Status/Error Messages */}
          {status && (
            <Alert className={status.includes('✅') ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!acknowledged || isCreating || isLoading}
              className="w-full sm:w-auto"
            >
              {isCreating || isLoading ? 'Creating...' : 'I Agree & Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
