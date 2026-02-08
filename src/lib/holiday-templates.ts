/**
 * Holiday Template Library
 * Pre-built letter templates for major holidays and occasions
 */

export interface HolidayTemplate {
  name: string;
  occasion: string;
  message: string;
  tone: string;
  frontImageUrl?: string;
}

export const HOLIDAY_TEMPLATES: HolidayTemplate[] = [
  {
    name: 'Christmas Greeting',
    occasion: 'Christmas',
    message: `Dear {{name}},

Wishing you a magical Christmas and a wonderful new year ahead! {{firstName}}, this holiday season reminds us of the joy that comes from connecting with cherished friends and family.

May your {{month}} be filled with warmth, laughter, and all the things that bring you happiness.

With warm regards,
{{firstName}}`,
    tone: 'warm',
    frontImageUrl: 'https://images.unsplash.com/photo-1576919917521-7754971588de?w=400&h=300&fit=crop',
  },
  {
    name: 'New Year Wishes',
    occasion: 'New Year',
    message: `Happy New Year, {{name}}!

As we step into {{year}}, I wanted to reach out and wish you an amazing year filled with health, happiness, and success. Here's to new beginnings and wonderful moments ahead!

May {{year}} be your best year yet!

Warm wishes,
{{firstName}}`,
    tone: 'uplifting',
    frontImageUrl: 'https://images.unsplash.com/photo-1504634126064-81342ee5ff30?w=400&h=300&fit=crop',
  },
  {
    name: 'Birthday Celebration',
    occasion: 'Birthday',
    message: `Happy Birthday, {{name}}!

On this special day, I wanted to celebrate you and all the wonderful things that make you unique. Thank you for being such an amazing friend – {{firstName}}, your kindness and humor brighten everyone's lives.

Here's to another year of adventures, growth, and joy!

Cheers to you!
{{firstName}}`,
    tone: 'celebratory',
    frontImageUrl: 'https://images.unsplash.com/photo-1551632786-de41eccbccda?w=400&h=300&fit=crop',
  },
  {
    name: 'Thank You Letter',
    occasion: 'Thank You',
    message: `Dear {{name}},

I wanted to take a moment to express my heartfelt gratitude for {{custom1 || 'your kindness and support'}}. {{firstName}}, your generosity and thoughtfulness mean more to me than words can express.

Thank you for being such a wonderful person and making a difference in my life.

With sincere appreciation,
{{firstName}}`,
    tone: 'grateful',
  },
  {
    name: 'Congratulations',
    occasion: 'Congratulations',
    message: `Dear {{name}},

Congratulations on your amazing achievement! I am so proud of you, {{firstName}}. Your hard work, dedication, and perseverance have truly paid off.

This is just the beginning of all the wonderful things you'll accomplish. Wishing you continued success and happiness in everything you do!

With admiration and best wishes,
{{firstName}}`,
    tone: 'congratulatory',
    frontImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
  },
  {
    name: 'Thinking of You',
    occasion: 'Thinking of You',
    message: `Dear {{name}},

I wanted to let you know that you've been on my mind. During this time, I hope you know that I'm here for you and thinking of you often.

Your strength and resilience are inspiring, {{firstName}}. Please take care of yourself and know that better days are ahead.

Sending you warmth and support,
{{firstName}}`,
    tone: 'compassionate',
  },
  {
    name: 'Apology Letter',
    occasion: 'Apology',
    message: `Dear {{name}},

I want to sincerely apologize for {{custom1 || 'my recent actions'}}. {{firstName}}, I deeply regret my behavior and the hurt it may have caused you. That's not who I want to be, and I'm committed to doing better.

Your friendship means everything to me, and I hope you can find it in your heart to forgive me.

With sincere regret and hope for reconciliation,
{{firstName}}`,
    tone: 'sincere',
  },
  {
    name: 'Welcome to the Team',
    occasion: 'Welcome',
    message: `Dear {{name}},

Welcome! We're thrilled to have you join our team. {{firstName}}, we're confident that you'll bring valuable skills and fresh perspectives to our organization.

Looking forward to working with you and getting to know you better. Don't hesitate to reach out if you need anything!

Welcome aboard,
{{firstName}}`,
    tone: 'professional-friendly',
  },
  {
    name: 'Anniversary Wishes',
    occasion: 'Anniversary',
    message: `Dear {{name}},

Happy Anniversary! Wishing you both a wonderful day and an incredible year ahead. {{firstName}}, watching your love story unfold has been such a joy.

May your bond continue to grow stronger with each passing day. Here's to many more years of love, laughter, and cherished memories together!

With warm wishes,
{{firstName}}`,
    tone: 'warm',
    frontImageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
  },
  {
    name: 'Get Well Soon',
    occasion: 'Get Well',
    message: `Dear {{name}},

Sending you healing thoughts and well wishes during this time. {{firstName}}, I hope you feel better very soon. Please take care of yourself and know that you're in my thoughts.

Can't wait to see you back to your healthy, wonderful self!

With caring thoughts,
{{firstName}}`,
    tone: 'compassionate',
    frontImageUrl: 'https://images.unsplash.com/photo-1587489073147-bc471edd7985?w=400&h=300&fit=crop',
  },
];

/**
 * Get a single holiday template by occasion name
 */
export function getHolidayTemplate(occasion: string): HolidayTemplate | undefined {
  return HOLIDAY_TEMPLATES.find(
    (template) => template.occasion.toLowerCase() === occasion.toLowerCase()
  );
}

/**
 * Get all available holiday occasions
 */
export function getAvailableOccasions(): string[] {
  return HOLIDAY_TEMPLATES.map((template) => template.occasion);
}
