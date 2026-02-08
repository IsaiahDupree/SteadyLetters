'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRecurringLetters, pauseRecurringLetter, resumeRecurringLetter, deleteRecurringLetter } from '@/app/actions/recurring-letters';
import { formatFrequency } from '@/lib/recurring-letters';
import Link from 'next/link';

interface RecurringLetter {
  id: string;
  name: string;
  frequency: string;
  active: boolean;
  nextSendAt: string;
  lastSentAt: string | null;
  recipient: {
    name: string;
    address1: string;
    city: string;
    state: string;
  };
}

export default function RecurringLettersPage() {
  const [letters, setLetters] = useState<RecurringLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLetters();
  }, []);

  async function loadLetters() {
    try {
      setLoading(true);
      const data = await getRecurringLetters();
      setLetters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring letters');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      if (active) {
        await pauseRecurringLetter(id);
      } else {
        await resumeRecurringLetter(id);
      }
      loadLetters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recurring letter');
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this recurring letter?')) {
      try {
        await deleteRecurringLetter(id);
        loadLetters();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete recurring letter');
      }
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recurring Letters</h1>
        <Link href="/recurring-letters/new">
          <Button>Create Recurring Letter</Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {letters.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No recurring letters yet</p>
          <Link href="/recurring-letters/new">
            <Button>Create Your First Recurring Letter</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => (
            <Card key={letter.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{letter.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    To: {letter.recipient.name}, {letter.recipient.city}, {letter.recipient.state}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Frequency: {formatFrequency(letter.frequency as any)}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Next send: {new Date(letter.nextSendAt).toLocaleDateString()}
                  </p>
                  {letter.lastSentAt && (
                    <p className="text-sm text-gray-600">
                      Last sent: {new Date(letter.lastSentAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={letter.active ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleActive(letter.id, letter.active)}
                  >
                    {letter.active ? 'Pause' : 'Resume'}
                  </Button>
                  <Link href={`/recurring-letters/${letter.id}`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(letter.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <span className={`text-xs px-2 py-1 rounded ${letter.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {letter.active ? 'Active' : 'Paused'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
