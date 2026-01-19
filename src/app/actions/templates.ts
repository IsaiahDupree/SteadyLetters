'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getCurrentUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: any) {
                    cookieStore.delete(name);
                },
            },
        }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error('Unauthorized. Please sign in.');
    }
    
    return user;
}

export async function createTemplate(data: {
    name: string;
    frontImageUrl?: string;
    message: string;
    handwritingStyle: string;
    tone?: string;
    occasion?: string;
}) {
    try {
        const user = await getCurrentUser();
        
        // Ensure user exists in Prisma
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email || '',
            },
        });

        const template = await prisma.template.create({
            data: {
                userId: user.id,
                name: data.name,
                frontImageUrl: data.frontImageUrl || null,
                message: data.message,
                handwritingStyle: data.handwritingStyle,
                tone: data.tone,
                occasion: data.occasion,
            },
        });

        revalidatePath('/templates');
        return { success: true, template };
    } catch (error: any) {
        console.error('Failed to create template:', error);
        return { success: false, error: error.message || 'Failed to create template' };
    }
}

export async function getTemplates() {
    try {
        const user = await getCurrentUser();
        
        const templates = await prisma.template.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return templates;
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return [];
    }
}

export async function updateTemplate(id: string, data: {
    name?: string;
    frontImageUrl?: string;
    message?: string;
    handwritingStyle?: string;
    tone?: string;
    occasion?: string;
}) {
    try {
        const user = await getCurrentUser();
        
        const existing = await prisma.template.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
            return { success: false, error: 'Template not found or unauthorized' };
        }

        const template = await prisma.template.update({
            where: { id },
            data,
        });

        revalidatePath('/templates');
        return { success: true, template };
    } catch (error: any) {
        console.error('Failed to update template:', error);
        return { success: false, error: error.message || 'Failed to update template' };
    }
}

export async function deleteTemplate(id: string) {
    try {
        const user = await getCurrentUser();
        
        const existing = await prisma.template.findUnique({ where: { id } });
        if (!existing || existing.userId !== user.id) {
            return { success: false, error: 'Template not found or unauthorized' };
        }

        await prisma.template.delete({
            where: { id },
        });
        revalidatePath('/templates');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete template:', error);
        return { success: false, error: error.message || 'Failed to delete template' };
    }
}
