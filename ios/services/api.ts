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
    .from('Recipient')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(friendlyError(error));
  // Map DB camelCase columns to app's expected field names
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    address: r.address1,
    address2: r.address2 || undefined,
    city: r.city,
    province: r.state,
    postal_code: r.zip,
    country: r.country || 'US',
  }));
}

export async function createRecipient(recipient: Omit<Recipient, 'id'>): Promise<Recipient> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('Recipient')
    .insert({
      userId: user.id,
      name: recipient.name,
      address1: recipient.address,
      address2: recipient.address2 || '',
      city: recipient.city,
      state: recipient.province,
      zip: recipient.postal_code,
      country: recipient.country || 'US',
    })
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return {
    name: data.name,
    address: data.address1,
    address2: data.address2 || undefined,
    city: data.city,
    province: data.state,
    postal_code: data.zip,
    country: data.country || 'US',
  } as Recipient & { id: string };
}

export async function updateRecipient(id: string, updates: Partial<Recipient>): Promise<Recipient> {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.address !== undefined) dbUpdates.address1 = updates.address;
  if (updates.address2 !== undefined) dbUpdates.address2 = updates.address2;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.province !== undefined) dbUpdates.state = updates.province;
  if (updates.postal_code !== undefined) dbUpdates.zip = updates.postal_code;
  if (updates.country !== undefined) dbUpdates.country = updates.country;

  const { data, error } = await supabase
    .from('Recipient')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return {
    name: data.name,
    address: data.address1,
    address2: data.address2 || undefined,
    city: data.city,
    province: data.state,
    postal_code: data.zip,
    country: data.country || 'US',
  } as Recipient & { id: string };
}

export async function deleteRecipient(id: string): Promise<void> {
  const { error } = await supabase.from('Recipient').delete().eq('id', id);
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
    .from('Order')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(friendlyError(error));
  return (data ?? []).map((o: any) => ({
    id: o.id,
    user_id: o.userId,
    thanks_io_order_id: o.thanksIoOrderId,
    product_type: o.productType || 'postcard',
    status: o.status,
    recipient_name: o.recipientName || '',
    recipient_address: o.recipientAddress || '',
    message_preview: o.messagePreview || '',
    cost: o.cost || 0,
    created_at: o.createdAt,
  }));
}

export async function createOrder(order: Omit<Order, 'id' | 'user_id' | 'created_at'>): Promise<Order> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('Order')
    .insert({
      userId: user.id,
      thanksIoOrderId: order.thanks_io_order_id,
      status: order.status,
      recipientId: null, // optional FK
      templateId: null, // optional FK
    })
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return {
    id: data.id,
    user_id: data.userId,
    thanks_io_order_id: data.thanksIoOrderId,
    product_type: order.product_type,
    status: data.status,
    recipient_name: order.recipient_name,
    recipient_address: order.recipient_address,
    message_preview: order.message_preview,
    cost: order.cost,
    created_at: data.createdAt,
  };
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
      .from('UserUsage')
      .select('*')
      .eq('userId', user.id)
      .single();

    // PGRST116 = row not found
    if (error && error.code !== 'PGRST116' && !error.message?.includes('does not exist')) {
      throw error;
    }

    return {
      letterGenerations: data?.letterGenerations ?? 0,
      imageGenerations: data?.imageGenerations ?? 0,
      lettersSent: data?.lettersSent ?? 0,
      tier: (data?.tier as UsageStats['tier']) ?? 'free',
    };
  } catch {
    return {
      letterGenerations: 0,
      imageGenerations: 0,
      lettersSent: 0,
      tier: 'free',
    };
  }
}

export async function incrementUsage(field: 'letter_generations' | 'image_generations' | 'letters_sent'): Promise<void> {
  // Map snake_case field names to camelCase DB column names
  const fieldMap: Record<string, string> = {
    letter_generations: 'letterGenerations',
    image_generations: 'imageGenerations',
    letters_sent: 'lettersSent',
  };
  const dbField = fieldMap[field] || field;

  try {
    const user = await requireUser();

    // Try to get existing usage row
    const { data } = await supabase
      .from('UserUsage')
      .select(dbField)
      .eq('userId', user.id)
      .single();

    if (data) {
      const current = (data as Record<string, any>)[dbField] || 0;
      await supabase
        .from('UserUsage')
        .update({ [dbField]: current + 1 })
        .eq('userId', user.id);
    } else {
      await supabase
        .from('UserUsage')
        .insert({ userId: user.id, [dbField]: 1, tier: 'free' });
    }
  } catch (e) {
    console.warn('incrementUsage:', e instanceof Error ? e.message : e);
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
      .from('Template')
      .select('*')
      .or(`aiGenerated.eq.false,userId.eq.${user.id}`)
      .order('name');

    if (error) throw error;
    return (data ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      occasion: t.occasion || '',
      tone: t.tone || '',
      content: t.message || '',
      is_system: t.aiGenerated === false && t.userId !== user.id,
    }));
  } catch {
    return [];
  }
}

export async function saveTemplate(template: Omit<LetterTemplate, 'id' | 'is_system'>): Promise<LetterTemplate> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from('Template')
    .insert({
      userId: user.id,
      name: template.name,
      message: template.content,
      occasion: template.occasion,
      tone: template.tone,
      aiGenerated: true,
    })
    .select()
    .single();

  if (error) throw new Error(friendlyError(error));
  return {
    id: data.id,
    name: data.name,
    occasion: data.occasion || '',
    tone: data.tone || '',
    content: data.message || '',
    is_system: false,
  };
}
