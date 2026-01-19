'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

const returnAddressSchema = z.object({
    returnName: z.string().min(2, 'Name must be at least 2 characters'),
    returnAddress1: z.string().min(5, 'Address must be at least 5 characters'),
    returnAddress2: z.string().optional(),
    returnCity: z.string().min(2, 'City must be at least 2 characters'),
    returnState: z.string().min(2, 'State must be at least 2 characters'),
    returnZip: z.string().min(5, 'ZIP code must be at least 5 characters'),
    returnCountry: z.string().optional().default('US'),
});

type ReturnAddressValues = z.input<typeof returnAddressSchema>;

interface ReturnAddressFormProps {
    initialData?: Partial<ReturnAddressValues>;
}

export function ReturnAddressForm({ initialData }: ReturnAddressFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ReturnAddressValues>({
        resolver: zodResolver(returnAddressSchema),
        defaultValues: {
            returnName: initialData?.returnName ?? '',
            returnAddress1: initialData?.returnAddress1 ?? '',
            returnAddress2: initialData?.returnAddress2 ?? '',
            returnCity: initialData?.returnCity ?? '',
            returnState: initialData?.returnState ?? '',
            returnZip: initialData?.returnZip ?? '',
            returnCountry: initialData?.returnCountry ?? 'US',
        },
    });

    async function onSubmit(data: ReturnAddressValues) {
        setLoading(true);
        try {
            const response = await fetch('/api/settings/return-address', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to update return address');

            toast.success('Return address updated');
        } catch (error) {
            toast.error('Failed to update return address');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Return Address
                </CardTitle>
                <CardDescription>
                    This address will be used as the return address for all your mailed letters.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="returnName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name or Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="returnAddress1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 1</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="returnAddress2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Apt 4B" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="returnCity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="New York" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="returnState"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <FormControl>
                                            <Input placeholder="NY" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="returnZip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ZIP Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Return Address'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
