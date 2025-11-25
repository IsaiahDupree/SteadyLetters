export type Recipient = {
    id: string;
    userId: string;
    name: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
    createdAt: Date;
};

export type Template = {
    id: string;
    userId: string;
    name: string;
    frontImageUrl: string | null;
    message: string;
    handwritingStyle: string;
    createdAt: Date;
};

export type Order = {
    id: string;
    userId: string;
    recipientId: string;
    templateId: string | null;
    thanksIoOrderId: string | null;
    status: string;
    createdAt: Date;
};
