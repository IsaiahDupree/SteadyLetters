import { supabase } from './supabase';
import type { Recipient } from './thanks-io';

// -------------------------------------------------------------------
// Recipients CRUD
// -------------------------------------------------------------------

export async function getRecipients(): Promise<Recipient[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recipients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createRecipient(recipient: Omit<Recipient, 'id'>): Promise<Recipient> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recipients')
    .insert({ ...recipient, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient> {
  const { data, error } = await supabase
    .from('recipients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecipient(id: string): Promise<void> {
  const { error } = await supabase.from('recipients').delete().eq('id', id);
  if (error) throw error;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createOrder(order: Omit<Order, 'id' | 'user_id' | 'created_at'>): Promise<Order> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...order, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return data ?? {
    letterGenerations: 0,
    imageGenerations: 0,
    lettersSent: 0,
    tier: 'free',
  };
}

export async function incrementUsage(field: 'letter_generations' | 'image_generations' | 'letters_sent'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: user.id,
    p_field: field,
  });

  if (error) throw error;
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
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${user?.id}`)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function saveTemplate(template: Omit<LetterTemplate, 'id' | 'is_system'>): Promise<LetterTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('templates')
    .insert({ ...template, user_id: user.id, is_system: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}
