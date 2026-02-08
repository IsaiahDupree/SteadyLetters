import { TemplateForm } from '@/features/templates/template-form';
import { TemplateList } from '@/features/templates/template-list';
import { HolidayTemplatesGallery } from '@/features/templates/holiday-templates-gallery';

export const dynamic = 'force-dynamic';

export default function TemplatesPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                    Templates
                </h1>
                <p className="text-muted-foreground text-lg">
                    Reusable letter templates for quick personalization
                </p>
            </div>
            <div className="flex gap-2 justify-end">
                <HolidayTemplatesGallery />
                <TemplateForm />
            </div>
            <TemplateList />
        </div>
    );
}
