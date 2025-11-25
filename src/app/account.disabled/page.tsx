import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ReturnAddressForm } from '@/features/settings/return-address-form';
import { redirect } from 'next/navigation';

export default async function AccountSettingsPage() {
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
        redirect('/login');
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            returnName: true,
            returnAddress1: true,
            returnAddress2: true,
            returnCity: true,
            returnState: true,
            returnZip: true,
            returnCountry: true,
        },
    });

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                    Account Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account preferences and default settings.
                </p>
            </div>

            <div className="grid gap-8">
                <ReturnAddressForm initialData={{
                    returnName: dbUser?.returnName ?? undefined,
                    returnAddress1: dbUser?.returnAddress1 ?? undefined,
                    returnAddress2: dbUser?.returnAddress2 ?? undefined,
                    returnCity: dbUser?.returnCity ?? undefined,
                    returnState: dbUser?.returnState ?? undefined,
                    returnZip: dbUser?.returnZip ?? undefined,
                    returnCountry: dbUser?.returnCountry ?? undefined,
                }} />
            </div>
        </div>
    );
}
