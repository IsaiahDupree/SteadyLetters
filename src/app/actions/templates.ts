'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createTemplate(data: {
    name: string;
    frontImageUrl?: string;
    message: string;
    handwritingStyle: string;
}) {
    try {
        const template = await prisma.template.create({
            data: {
                userId: 'default-user', // TODO: Replace with actual user ID
                name: data.name,
                frontImageUrl: data.frontImageUrl || '',
                message: data.message,
                handwritingStyle: data.handwritingStyle,
            },
        });

        revalidatePath('/templates');
        return { success: true, template };
    } catch (error) {
        console.error('Failed to create template:', error);
        return { success: false, error: 'Failed to create template' };
    }
}

export async function getTemplates() {
    try {
        const templates = await prisma.template.findMany({
            where: {
                userId: 'default-user', // TODO: Filter by actual user ID
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

export async function deleteTemplate(id: string) {
    try {
        await prisma.template.delete({
            where: { id },
        });
        revalidatePath('/templates');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete template:', error);
        return { success: false, error: 'Failed to delete template' };
    }
}
