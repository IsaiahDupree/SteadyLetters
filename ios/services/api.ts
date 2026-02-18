import { supabase } from './supabase';
import type { Recipient } from './thanks-io';

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function friendlyError(error: any): string {
  if (!error) return 'An unknown error occurred';
  const msg = error.message || String(error);
  if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
    return 'No internet connection. Please check your network and try again.';
  }
  if (msg.includes('JWT expired') || msg.includes('not authenticated')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return 'This record already exists.';
  }
  if (msg.includes('permission denied') || msg.includes('row-level security')) {
    return 'You don\'t have permission to perform this action.';
  }
  return msg;
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Please sign in to continue.');
  return user;
}

// -------------------------------------------------------------------
// Recipients CRUD
// -------------------------------------------------------------------

export async function getRecipients(): Promise<Recipient[]> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(friendlyError(error));
  return data ?? [];
}

export async function createRecipient(recipient: Omit<Recipient, 'id'>): Promise<Recipient> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('recipients')
    .insert({ ...recipient, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return data;
}

export async function updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient> {
  const { data, error } = await supabase
    .from('recipients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return data;
}

export async function deleteRecipient(id: string): Promise<void> {
  const { error } = await supabase.from('recipients').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error));
}

// -------------------------------------------------------------------
// Orders
// -------------------------------------------------------------------

export interface Order {
  id: string;
  user_id: string;
  thanks_io_order_id: string;
  product_type: string;
  status: string;
  recipient_name: string;
  recipient_address: string;
  message_preview: string;
  cost: number;
  created_at: string;
}

export async function getOrders(): Promise<Order[]> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(friendlyError(error));
  return data ?? [];
}

export async function createOrder(order: Omit<Order, 'id' | 'user_id' | 'created_at'>): Promise<Order> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...order, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return data;
}

// -------------------------------------------------------------------
// Usage tracking
// -------------------------------------------------------------------

export interface UsageStats {
  letterGenerations: number;
  imageGenerations: number;
  lettersSent: number;
  tier: 'free' | 'pro' | 'business';
}

export async function getUsageStats(): Promise<UsageStats> {
  try {
    const user = await requireUser();

    const { data, error } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // PGRST116 = row not found, 42P01 = table doesn't exist
    if (error && error.code !== 'PGRST116' && !error.message?.includes('does not exist')) {
      throw error;
    }

    return data ?? {
      letterGenerations: 0,
      imageGenerations: 0,
      lettersSent: 0,
      tier: 'free',
    };
  } catch {
    // Gracefully return defaults if usage tracking isn't set up
    return {
      letterGenerations: 0,
      imageGenerations: 0,
      lettersSent: 0,
      tier: 'free',
    };
  }
}

export async function incrementUsage(field: 'letter_generations' | 'image_generations' | 'letters_sent'): Promise<void> {
  try {
    const user = await requireUser();

    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_field: field,
    });

    // Don't throw if the RPC doesn't exist yet — usage tracking is optional
    if (error && !error.message?.includes('does not exist')) {
      console.error('incrementUsage error:', error.message);
    }
  } catch (e) {
    console.error('incrementUsage error:', e);
  }
}

// -------------------------------------------------------------------
// Templates
// -------------------------------------------------------------------

export interface LetterTemplate {
  id: string;
  name: string;
  occasion: string;
  tone: string;
  content: string;
  is_system: boolean;
}

export async function getTemplates(): Promise<LetterTemplate[]> {
  try {
    const user = await requireUser();

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${user.id}`)
      .order('name');

    if (error) throw error;
    return data ?? [];
  } catch {
    // Return empty if templates table doesn't exist yet
    return [];
  }
}

export async function saveTemplate(template: Omit<LetterTemplate, 'id' | 'is_system'>): Promise<LetterTemplate> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('templates')
    .insert({ ...template, user_id: user.id, is_system: false })
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return data;
}
