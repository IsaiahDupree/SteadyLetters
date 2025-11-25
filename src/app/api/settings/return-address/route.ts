import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const returnAddressSchema = z.object({
    returnName: z.string().min(2),
    returnAddress1: z.string().min(5),
    returnAddress2: z.string().optional(),
    returnCity: z.string().min(2),
    returnState: z.string().min(2),
    returnZip: z.string().min(5),
    returnCountry: z.string().default('US'),
});

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = returnAddressSchema.parse(body);

        await prisma.user.update({
            where: { id: user.id },
            data: validatedData,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Return address update error:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update return address' },
            { status: 500 }
        );
    }
}
