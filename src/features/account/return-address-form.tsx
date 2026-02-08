'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateReturnAddress, getReturnAddress, type ReturnAddress } from '@/app/actions/account';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'AS', 'GU', 'MP', 'PR', 'UM', 'VI'
];

export function ReturnAddressForm() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnAddress, setReturnAddress] = useState<ReturnAddress>({
    country: 'US',
  });

  useEffect(() => {
    loadReturnAddress();
  }, []);

  const loadReturnAddress = async () => {
    setLoadingData(true);
    const result = await getReturnAddress();
    if (result.success) {
      setReturnAddress(result.returnAddress);
    }
    setLoadingData(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateReturnAddress(returnAddress);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to save return address');
    }

    setLoading(false);
  };

  if (loadingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branded Envelope Options</CardTitle>
          <CardDescription>
            Set a custom return address for your branded envelopes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading return address...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branded Envelope Options</CardTitle>
        <CardDescription>
          Set a custom return address that appears on all outgoing mail. This is useful for business accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Return Address Name</Label>
              <Input
                id="name"
                placeholder="Your name or company name"
                value={returnAddress.name || ''}
                onChange={(e) => setReturnAddress({ ...returnAddress, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address1">Street Address</Label>
              <Input
                id="address1"
                placeholder="123 Main St"
                value={returnAddress.address1 || ''}
                onChange={(e) => setReturnAddress({ ...returnAddress, address1: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address2">Apartment, Suite, etc. (optional)</Label>
              <Input
                id="address2"
                placeholder="Apt 4B"
                value={returnAddress.address2 || ''}
                onChange={(e) => setReturnAddress({ ...returnAddress, address2: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={returnAddress.city || ''}
                  onChange={(e) => setReturnAddress({ ...returnAddress, city: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={returnAddress.state || ''}
                  onValueChange={(value) => setReturnAddress({ ...returnAddress, state: value })}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                placeholder="10001"
                value={returnAddress.zip || ''}
                onChange={(e) => setReturnAddress({ ...returnAddress, zip: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={returnAddress.country || 'US'}
                onValueChange={(value) => setReturnAddress({ ...returnAddress, country: value })}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="flex gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>Return address saved successfully!</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save Return Address'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => loadReturnAddress()}
              disabled={loading}
            >
              Reset
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            <p className="font-semibold mb-1">💡 About Branded Envelopes</p>
            <p>
              Your custom return address will appear on all envelopes and letters you send through
              SteadyLetters. This is perfect for personal branding and business correspondence.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
