/**
 * Example Templates
 * Pre-defined letter templates that users can load as starting points
 */

export interface ExampleTemplate {
    id: string;
    name: string;
    description: string;
    context: string;
    tone: 'formal' | 'casual' | 'warm' | 'professional' | 'friendly';
    occasion: 'general' | 'birthday' | 'holiday' | 'congratulations' | 'thank-you' | 'sympathy' | 'get-well-soon';
    length: 'short' | 'medium' | 'long';
    category: 'business' | 'personal' | 'holiday' | 'special-occasion';
}

export const EXAMPLE_TEMPLATES: ExampleTemplate[] = [
    {
        id: 'thank-you-business',
        name: 'Thank You (Business)',
        description: 'Professional thank you letter for business contacts',
        context: 'Thank you for your partnership and support this year. We appreciate your business and look forward to continuing our relationship.',
        tone: 'professional',
        occasion: 'thank-you',
        length: 'medium',
        category: 'business',
    },
    {
        id: 'birthday-personal',
        name: 'Birthday Wishes',
        description: 'Warm birthday greeting for friends and family',
        context: 'Wishing you a wonderful birthday filled with joy, laughter, and all the things you love most. May this year bring you happiness and success.',
        tone: 'warm',
        occasion: 'birthday',
        length: 'short',
        category: 'personal',
    },
    {
        id: 'holiday-greeting',
        name: 'Holiday Greeting',
        description: 'Seasonal holiday message',
        context: 'Wishing you and your family a wonderful holiday season filled with peace, joy, and happiness. Thank you for being part of our lives this year.',
        tone: 'warm',
        occasion: 'holiday',
        length: 'medium',
        category: 'holiday',
    },
    {
        id: 'congratulations',
        name: 'Congratulations',
        description: 'Celebrate achievements and milestones',
        context: 'Congratulations on your amazing achievement! Your hard work and dedication have paid off, and I couldn\'t be happier for you.',
        tone: 'friendly',
        occasion: 'congratulations',
        length: 'short',
        category: 'special-occasion',
    },
    {
        id: 'sympathy',
        name: 'Sympathy & Condolences',
        description: 'Thoughtful message during difficult times',
        context: 'I am deeply sorry for your loss. Please know that you are in my thoughts during this difficult time. If there is anything I can do to help, please don\'t hesitate to reach out.',
        tone: 'formal',
        occasion: 'sympathy',
        length: 'medium',
        category: 'personal',
    },
    {
        id: 'get-well-soon',
        name: 'Get Well Soon',
        description: 'Wishing someone a speedy recovery',
        context: 'I hope this message finds you on the road to recovery. Take all the time you need to rest and heal. We\'re all thinking of you and sending positive thoughts your way.',
        tone: 'warm',
        occasion: 'get-well-soon',
        length: 'short',
        category: 'personal',
    },
    {
        id: 'thank-you-personal',
        name: 'Thank You (Personal)',
        description: 'Personal thank you note for friends and family',
        context: 'Thank you so much for everything you\'ve done. Your kindness and generosity mean the world to me, and I\'m truly grateful to have you in my life.',
        tone: 'warm',
        occasion: 'thank-you',
        length: 'medium',
        category: 'personal',
    },
    {
        id: 'business-introduction',
        name: 'Business Introduction',
        description: 'Professional introduction letter',
        context: 'I am writing to introduce myself and my company. We specialize in providing innovative solutions and would love the opportunity to discuss how we can work together.',
        tone: 'professional',
        occasion: 'general',
        length: 'medium',
        category: 'business',
    },
];

export function getExampleTemplateById(id: string): ExampleTemplate | undefined {
    return EXAMPLE_TEMPLATES.find(template => template.id === id);
}

export function getExampleTemplatesByCategory(category: ExampleTemplate['category']): ExampleTemplate[] {
    return EXAMPLE_TEMPLATES.filter(template => template.category === category);
}

export function getExampleTemplatesByOccasion(occasion: ExampleTemplate['occasion']): ExampleTemplate[] {
    return EXAMPLE_TEMPLATES.filter(template => template.occasion === occasion);
}


