import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getRecipients } from '@/app/actions/recipients';
import type { Recipient } from '@/lib/types';

export async function RecipientList() {
    const recipients = await getRecipients();

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Zip</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recipients.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No recipients yet. Add your first one!
                            </TableCell>
                        </TableRow>
                    ) : (
                        recipients.map((recipient: Recipient) => (
                            <TableRow key={recipient.id}>
                                <TableCell className="font-medium">{recipient.name}</TableCell>
                                <TableCell>{recipient.address1}</TableCell>
                                <TableCell>{recipient.city}</TableCell>
                                <TableCell>{recipient.state}</TableCell>
                                <TableCell>{recipient.zip}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
