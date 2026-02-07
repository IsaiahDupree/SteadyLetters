'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { findDuplicateRecipients, mergeRecipients } from '@/app/actions/recipients';
import type { DuplicateMatch } from '@/lib/duplicate-detection';
import { AlertCircle, Users, CheckCircle2 } from 'lucide-react';

export function DuplicateRecipientsDialog() {
  const [open, setOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await findDuplicateRecipients();

      if (result.success) {
        setDuplicates(result.duplicates);
      } else {
        setError(result.error || 'Failed to scan for duplicates');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (primaryId: string, duplicateId: string) => {
    const mergeKey = `${primaryId}-${duplicateId}`;
    setMerging(mergeKey);
    setError(null);

    try {
      const result = await mergeRecipients(primaryId, duplicateId);

      if (result.success) {
        // Remove the merged duplicate from the list
        setDuplicates(prev =>
          prev.filter(
            d =>
              !(d.recipient1.id === primaryId && d.recipient2.id === duplicateId) &&
              !(d.recipient1.id === duplicateId && d.recipient2.id === primaryId)
          )
        );
      } else {
        setError(result.error || 'Failed to merge recipients');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setMerging(null);
    }
  };

  const getMatchBadge = (matchType: 'exact' | 'likely' | 'possible') => {
    const variants: Record<typeof matchType, { variant: any; label: string }> = {
      exact: { variant: 'destructive', label: 'Exact Match' },
      likely: { variant: 'default', label: 'Likely Duplicate' },
      possible: { variant: 'secondary', label: 'Possible Duplicate' },
    };

    const config = variants[matchType];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleScan}>
          <Users className="mr-2 h-4 w-4" />
          Find Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duplicate Recipients</DialogTitle>
          <DialogDescription>
            We'll scan your address book for potential duplicate recipients based on name and
            address similarity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Scanning for duplicates...</p>
            </div>
          )}

          {!loading && duplicates.length === 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                No duplicate recipients found. Your address book looks clean!
              </AlertDescription>
            </Alert>
          )}

          {!loading && duplicates.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''}.
                Review and merge as needed.
              </p>

              {duplicates.map((match, index) => {
                const mergeKey1 = `${match.recipient1.id}-${match.recipient2.id}`;
                const mergeKey2 = `${match.recipient2.id}-${match.recipient1.id}`;
                const isMerging = merging === mergeKey1 || merging === mergeKey2;

                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMatchBadge(match.matchType)}
                        <span className="text-sm font-medium">
                          {match.confidence}% confident
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {match.matchReasons.join(' • ')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Recipient 1 */}
                      <div className="space-y-1 p-3 bg-muted/50 rounded">
                        <p className="font-semibold">{match.recipient1.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {match.recipient1.address1}
                        </p>
                        {match.recipient1.address2 && (
                          <p className="text-sm text-muted-foreground">
                            {match.recipient1.address2}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {match.recipient1.city}, {match.recipient1.state}{' '}
                          {match.recipient1.zip}
                        </p>
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleMerge(match.recipient1.id, match.recipient2.id)
                            }
                            disabled={isMerging}
                          >
                            {isMerging ? 'Merging...' : 'Keep This One'}
                          </Button>
                        </div>
                      </div>

                      {/* Recipient 2 */}
                      <div className="space-y-1 p-3 bg-muted/50 rounded">
                        <p className="font-semibold">{match.recipient2.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {match.recipient2.address1}
                        </p>
                        {match.recipient2.address2 && (
                          <p className="text-sm text-muted-foreground">
                            {match.recipient2.address2}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {match.recipient2.city}, {match.recipient2.state}{' '}
                          {match.recipient2.zip}
                        </p>
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleMerge(match.recipient2.id, match.recipient1.id)
                            }
                            disabled={isMerging}
                          >
                            {isMerging ? 'Merging...' : 'Keep This One'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {duplicates.length > 0 && (
            <Button onClick={handleScan} disabled={loading}>
              Rescan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
