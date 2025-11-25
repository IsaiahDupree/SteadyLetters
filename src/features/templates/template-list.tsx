import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTemplates } from '@/app/actions/templates';
import type { Template } from '@/lib/types';

export async function TemplateList() {
    const templates = await getTemplates();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>No Templates Yet</CardTitle>
                        <CardDescription>
                            Create your first template to get started!
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                templates.map((template: Template) => (
                    <Card key={template.id}>
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                            {template.frontImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={template.frontImageUrl}
                                    alt={template.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    No Image
                                </div>
                            )}
                        </div>
                        <CardHeader>
                            <CardTitle>{template.name}</CardTitle>
                            <CardDescription>{template.handwritingStyle}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline">Edit</Button>
                            <Button>Use</Button>
                        </CardFooter>
                    </Card>
                ))
            )}
        </div>
    );
}
