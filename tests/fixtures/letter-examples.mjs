/**
 * Letter Examples for Address Extraction Testing
 * 
 * Contains sample letter data with return addresses that can be used
 * for testing the address extraction feature.
 */

export const LETTER_EXAMPLES = [
    {
        id: 'example-1',
        description: 'Standard business letter with return address',
        returnAddress: {
            name: 'John Smith',
            address1: '123 Main Street',
            address2: 'Suite 400',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210',
            country: 'US',
        },
        formattedAddress: `John Smith
123 Main Street
Suite 400
Los Angeles, CA 90210`,
        letterContent: `Dear Friend,

Thank you for your recent correspondence. We appreciate your interest in our services.

Best regards,
John Smith`,
    },
    {
        id: 'example-2',
        description: 'Personal letter with simple return address',
        returnAddress: {
            name: 'Sarah Johnson',
            address1: '456 Oak Avenue',
            city: 'San Francisco',
            state: 'CA',
            zip: '94102',
            country: 'US',
        },
        formattedAddress: `Sarah Johnson
456 Oak Avenue
San Francisco, CA 94102`,
        letterContent: `Hi there!

I hope this letter finds you well. I wanted to reach out and say hello.

Warm regards,
Sarah`,
    },
    {
        id: 'example-3',
        description: 'Organization letter with company name',
        returnAddress: {
            name: 'Acme Corporation',
            address1: '789 Business Park Drive',
            address2: 'Building 5',
            city: 'Seattle',
            state: 'WA',
            zip: '98101',
            country: 'US',
        },
        formattedAddress: `Acme Corporation
789 Business Park Drive
Building 5
Seattle, WA 98101`,
        letterContent: `Dear Valued Customer,

We are pleased to inform you about our latest offerings.

Sincerely,
Customer Service Team
Acme Corporation`,
    },
    {
        id: 'example-4',
        description: 'Letter with apartment number',
        returnAddress: {
            name: 'Michael Chen',
            address1: '321 Elm Street',
            address2: 'Apt 12B',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
        },
        formattedAddress: `Michael Chen
321 Elm Street
Apt 12B
New York, NY 10001`,
        letterContent: `Hello,

I'm writing to follow up on our previous conversation.

Best,
Michael`,
    },
    {
        id: 'example-5',
        description: 'Letter with PO Box',
        returnAddress: {
            name: 'Emily Davis',
            address1: 'PO Box 1234',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            country: 'US',
        },
        formattedAddress: `Emily Davis
PO Box 1234
Austin, TX 78701`,
        letterContent: `Dear Recipient,

Thank you for your interest. Please find the information you requested enclosed.

Sincerely,
Emily Davis`,
    },
    {
        id: 'example-6',
        description: 'Letter with 9-digit ZIP code',
        returnAddress: {
            name: 'Robert Wilson',
            address1: '555 Pine Road',
            city: 'Chicago',
            state: 'IL',
            zip: '60601-1234',
            country: 'US',
        },
        formattedAddress: `Robert Wilson
555 Pine Road
Chicago, IL 60601-1234`,
        letterContent: `Greetings,

I wanted to share some exciting news with you.

Warmly,
Robert`,
    },
    {
        id: 'example-7',
        description: 'Letter without address2',
        returnAddress: {
            name: 'Lisa Anderson',
            address1: '888 Maple Lane',
            city: 'Boston',
            state: 'MA',
            zip: '02101',
            country: 'US',
        },
        formattedAddress: `Lisa Anderson
888 Maple Lane
Boston, MA 02101`,
        letterContent: `Hi,

Just wanted to drop you a note.

Take care,
Lisa`,
    },
    {
        id: 'example-8',
        description: 'Letter with state spelled out (should normalize to abbreviation)',
        returnAddress: {
            name: 'David Martinez',
            address1: '999 Cedar Boulevard',
            city: 'Miami',
            state: 'FL',
            zip: '33101',
            country: 'US',
        },
        formattedAddress: `David Martinez
999 Cedar Boulevard
Miami, FL 33101`,
        note: 'State should be extracted as "FL" even if written as "Florida"',
    },
];

/**
 * Get a random letter example
 */
export function getRandomLetterExample() {
    return LETTER_EXAMPLES[Math.floor(Math.random() * LETTER_EXAMPLES.length)];
}

/**
 * Get letter example by ID
 */
export function getLetterExampleById(id) {
    return LETTER_EXAMPLES.find(example => example.id === id);
}

/**
 * Get all return addresses as an array
 */
export function getAllReturnAddresses() {
    return LETTER_EXAMPLES.map(example => example.returnAddress);
}

/**
 * Create a formatted letter text with return address
 */
export function createFormattedLetter(exampleId) {
    const example = getLetterExampleById(exampleId);
    if (!example) return null;

    return `${example.formattedAddress}

${example.letterContent || ''}`;
}

/**
 * Test cases for address extraction validation
 */
export const EXTRACTION_TEST_CASES = [
    {
        name: 'Complete address with all fields',
        input: LETTER_EXAMPLES[0],
        expected: LETTER_EXAMPLES[0].returnAddress,
    },
    {
        name: 'Address without address2',
        input: LETTER_EXAMPLES[1],
        expected: LETTER_EXAMPLES[1].returnAddress,
    },
    {
        name: 'Organization name instead of person',
        input: LETTER_EXAMPLES[2],
        expected: LETTER_EXAMPLES[2].returnAddress,
    },
    {
        name: 'Address with apartment',
        input: LETTER_EXAMPLES[3],
        expected: LETTER_EXAMPLES[3].returnAddress,
    },
    {
        name: 'PO Box address',
        input: LETTER_EXAMPLES[4],
        expected: LETTER_EXAMPLES[4].returnAddress,
    },
    {
        name: '9-digit ZIP code',
        input: LETTER_EXAMPLES[5],
        expected: LETTER_EXAMPLES[5].returnAddress,
    },
];

