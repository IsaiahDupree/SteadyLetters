import { TemplateForm } from '@/features/templates/template-form';
import { TemplateList } from '@/features/templates/template-list';

export default function TemplatesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
                <TemplateForm />
            </div>
            <TemplateList />
        </div>
    );
}
