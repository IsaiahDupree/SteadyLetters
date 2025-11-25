'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Wand2, Image as ImageIcon, Send, DollarSign } from 'lucide-react';
import { HandwritingStyle, ProductType, PostcardSize, PRODUCT_CATALOG, getPostcardPrice } from '@/lib/thanks-io';
import { ColorPicker } from '@/components/ui/color-picker';

// Card styles for Thanks.io API
const cardStyles = [
    { id: 'classic-white', name: 'Classic White', description: 'Traditional white notecard' },
    { id: 'cream-linen', name: 'Cream Linen', description: 'Textured cream paper' },
    { id: 'kraft', name: 'Kraft', description: 'Natural kraft paper' },
    { id: 'color-bordered', name: 'Color Border', description: 'White with color border' },
];

// Envelope styles
const envelopeStyles = [
    { id: 'standard-white', name: 'Standard White' },
    { id: 'kraft-brown', name: 'Kraft Brown' },
    { id: 'colored', name: 'Colored (Match Card)' },
];

interface EnhancedLetterResultProps {
    initialLetter: string;
    onSave: (
        letter: string,
        options: {
            handwriting: string;
            cardStyle: string;
            envelope: string;
            frontImage?: string;
        }
    ) => void;
    onSendNow?: (letter: string, options: any) => void;
    tone?: string;
    occasion?: string;
}

export function EnhancedLetterResult({
    initialLetter,
    onSave,
    onSendNow,
    tone = 'warm',
    occasion = 'general',
}: EnhancedLetterResultProps) {
    const [letter, setLetter] = useState(initialLetter);
    const [isEditing, setIsEditing] = useState(false);
    const [handwriting, setHandwriting] = useState('1');
    const [productType, setProductType] = useState<ProductType>('postcard');
    const [postcardSize, setPostcardSize] = useState<PostcardSize>('4x6');
    const [cardStyle, setCardStyle] = useState('classic-white');
    const [envelope, setEnvelope] = useState('standard-white');
    const [frontImage, setFrontImage] = useState<string>('');
    const [generatingImage, setGeneratingImage] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');
    const [handwritingFonts, setHandwritingFonts] = useState<HandwritingStyle[]>([]);
    const [handwritingColor, setHandwritingColor] = useState<string>('blue');

    useEffect(() => {
        // Fetch handwriting styles from our API wrapper (or mock)
        // Since we can't easily call the server-side lib from client, 
        // we'll use the hardcoded list for now, but in a real app we'd fetch from an API route
        // that wraps the Thanks.io call.
        // For this implementation, we'll stick to the mock list in the component 
        // to avoid creating another API route just for styles right now, 
        // as the user's request focused on the integration logic.
        // But let's use the same list as the lib to be consistent.

        // Use mock styles matching the API IDs
        setHandwritingFonts([
            { id: '1', name: 'Jeremy', style: 'Casual & Friendly' },
            { id: '2', name: 'Tribeca', style: 'Professional & Clean' },
            { id: '3', name: 'Terry', style: 'Elegant & Formal' },
            { id: '4', name: 'Madeline', style: 'Warm & Personal' },
            { id: '5', name: 'Brooklyn', style: 'Modern & Bold' },
            { id: '6', name: 'Signature', style: 'Sophisticated' },
        ]);
    }, []);

    const handleGenerateFrontImage = async () => {
        setGeneratingImage(true);
        try {
            // Use DALL-E to generate a front image based on ALL available context
            const response = await fetch('/api/generate/card-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tone,
                    occasion,
                    letterContent: letter, // Pass the actual letter content for theme extraction
                    // imageAnalysis would come from the original image upload if available
                }),
            });

            const data = await response.json();
            if (response.ok && data.imageUrl) {
                setFrontImage(data.imageUrl);
                setActiveTab('design');
            } else {
                alert(data.error || 'Failed to generate image');
            }
        } catch (error) {
            console.error('Image generation error:', error);
            alert('Failed to generate front image');
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleSave = () => {
        onSave(letter, {
            handwriting,
            cardStyle,
            envelope,
            frontImage,
            productType,
            postcardSize: productType === 'postcard' ? postcardSize : undefined,
            handwritingColor,
        } as any); // Temporarily use 'as any' until we update the prop types
    };

    const handleSendNow = () => {
        if (onSendNow) {
            onSendNow(letter, {
                handwriting,
                cardStyle,
                envelope,
                frontImage,
                productType,
                postcardSize: productType === 'postcard' ? postcardSize : undefined,
                handwritingColor,
            });
        }
    };

    const getFontFamily = (id: string) => {
        const map: Record<string, string> = {
            jeremy: 'var(--font-handwriting-casual)',
            tribeca: 'var(--font-handwriting-professional)',
            terry: 'var(--font-handwriting-elegant)',
            madeline: 'var(--font-handwriting-warm)',
            brooklyn: 'var(--font-handwriting-bold)',
            signature: 'var(--font-handwriting-signature)',
        };
        return map[id] || 'inherit';
    };

    const getCardBackground = (id: string) => {
        const map: Record<string, string> = {
            'classic-white': '#ffffff',
            'cream-linen': '#fdfbf7',
            'kraft': '#e6d2b5',
            'color-bordered': '#ffffff',
        };
        return map[id] || '#ffffff';
    };

    const getCardBorder = (id: string) => {
        if (id === 'color-bordered') return '8px solid #3b82f6'; // Example blue border
        return 'none';
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Preview & Edit</TabsTrigger>
                    <TabsTrigger value="design">Design Options</TabsTrigger>
                    <TabsTrigger value="send">Send Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Generated Letter</CardTitle>
                                    <CardDescription>
                                        Edit your letter or customize the design
                                    </CardDescription>
                                </div>
                                <Button
                                    variant={isEditing ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Done Editing' : 'Edit Letter'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <Textarea
                                    value={letter}
                                    onChange={(e) => setLetter(e.target.value)}
                                    rows={15}
                                    className="font-serif text-base leading-relaxed"
                                    placeholder="Edit your letter..."
                                />
                            ) : (
                                <div className="whitespace-pre-wrap rounded-lg border p-6 min-h-[400px] bg-[#fffef9] font-serif text-base leading-relaxed shadow-inner">
                                    {letter}
                                </div>
                            )}
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <span>{letter.length} characters</span>
                                <span>~{Math.ceil(letter.split(' ').length / 100)} pages</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="design" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Controls Column */}
                        <div className="space-y-6">
                            {/* Product Type Selector */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Product Type
                                    </CardTitle>
                                    <CardDescription>
                                        Choose the type of mail to send
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PRODUCT_CATALOG).map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{product.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ${product.basePrice.toFixed(2)} - {product.description}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Postcard Size Selector */}
                                    {productType === 'postcard' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <Label>Postcard Size</Label>
                                            <Select value={postcardSize} onValueChange={(v) => setPostcardSize(v as PostcardSize)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="4x6">
                                                        <span>4x6 - ${getPostcardPrice('4x6').toFixed(2)}</span>
                                                    </SelectItem>
                                                    <SelectItem value="6x9">
                                                        <span>6x9 - ${getPostcardPrice('6x9').toFixed(2)}</span>
                                                    </SelectItem>
                                                    <SelectItem value="6x11">
                                                        <span>6x11 - ${getPostcardPrice('6x11').toFixed(2)}</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Pricing Display */}
                                    <div className="rounded-lg border p-3 bg-muted/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Estimated Price:</span>
                                            <span className="text-lg font-bold text-primary">
                                                $
                                                {productType === 'postcard'
                                                    ? getPostcardPrice(postcardSize).toFixed(2)
                                                    : PRODUCT_CATALOG[productType].basePrice.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Includes postage
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Handwriting Font</CardTitle>
                                    <CardDescription>
                                        Choose the handwriting style for your letter
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Select value={handwriting} onValueChange={setHandwriting}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {handwritingFonts.map((font) => (
                                                <SelectItem key={font.id} value={font.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium" style={{ fontFamily: getFontFamily(font.id), fontSize: '1.1em' }}>{font.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {font.style}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Handwriting Color Picker */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Handwriting Color</CardTitle>
                                    <CardDescription>
                                        Choose the color of the handwritten text
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ColorPicker
                                        value={handwritingColor}
                                        onChange={setHandwritingColor}
                                        label=""
                                        colors={['blue', 'black', 'green', 'purple', 'red']}
                                        allowCustom={true}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Card Style</CardTitle>
                                    <CardDescription>
                                        Select the paper and card design
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Card Type</Label>
                                        <Select value={cardStyle} onValueChange={setCardStyle}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cardStyles.map((style) => (
                                                    <SelectItem key={style.id} value={style.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{style.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {style.description}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Envelope Style</Label>
                                        <Select value={envelope} onValueChange={setEnvelope}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {envelopeStyles.map((style) => (
                                                    <SelectItem key={style.id} value={style.id}>
                                                        {style.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Front Image</CardTitle>
                                    <CardDescription>
                                        Add AI-generated artwork to your card's front
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {frontImage ? (
                                        <div className="space-y-4">
                                            <img
                                                src={frontImage}
                                                alt="Card front"
                                                className="w-full rounded-lg border shadow-sm"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleGenerateFrontImage}
                                                disabled={generatingImage}
                                                className="w-full"
                                            >
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                Generate Different Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleGenerateFrontImage}
                                            disabled={generatingImage}
                                            className="w-full"
                                        >
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            {generatingImage ? 'Generating...' : 'Generate Front Image'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Live Preview Column */}
                        <div className="space-y-6">
                            <div className="sticky top-6">
                                <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                                <div
                                    className="relative rounded-lg shadow-xl transition-all duration-300 min-h-[500px] p-8 overflow-hidden"
                                    style={{
                                        backgroundColor: getCardBackground(cardStyle),
                                        border: getCardBorder(cardStyle),
                                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
                                    }}
                                >
                                    {/* Texture overlay for realism */}
                                    {cardStyle === 'kraft' && (
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/kraft-paper.png')]" />
                                    )}
                                    {cardStyle === 'cream-linen' && (
                                        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
                                    )}

                                    <div className="relative z-10 space-y-6">
                                        {frontImage && (
                                            <div className="mb-6 rounded-md overflow-hidden shadow-sm border border-black/5 max-w-[200px] mx-auto transform rotate-1">
                                                <img src={frontImage} alt="Card Front" className="w-full h-auto" />
                                                <p className="text-center text-[10px] text-muted-foreground py-1 bg-white/80">Card Front</p>
                                            </div>
                                        )}

                                        <div
                                            className="whitespace-pre-wrap text-lg leading-relaxed"
                                            style={{
                                                fontFamily: getFontFamily(handwriting),
                                                color: '#1a1a1a',
                                            }}
                                        >
                                            {letter}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-sm text-muted-foreground mt-4">
                                    This is a digital preview. The actual handwritten card will vary slightly.
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="send" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ready to Send</CardTitle>
                            <CardDescription>
                                Save as template or send your letter now
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                                <h4 className="font-medium">Your Configuration:</h4>
                                <div className="text-sm space-y-1 text-muted-foreground">
                                    <p>
                                        <span className="font-medium">Handwriting:</span>{' '}
                                        {
                                            handwritingFonts.find((f) => f.id === handwriting)
                                                ?.name
                                        }
                                    </p>
                                    <p>
                                        <span className="font-medium">Card:</span>{' '}
                                        {cardStyles.find((s) => s.id === cardStyle)?.name}
                                    </p>
                                    <p>
                                        <span className="font-medium">Envelope:</span>{' '}
                                        {envelopeStyles.find((e) => e.id === envelope)?.name}
                                    </p>
                                    <p>
                                        <span className="font-medium">Front Image:</span>{' '}
                                        {frontImage ? 'Yes' : 'No'}
                                    </p>
                                    <p>
                                        <span className="font-medium">Length:</span> {letter.length}{' '}
                                        characters
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button onClick={handleSave} className="w-full" size="lg">
                                    Save as Template
                                </Button>
                                {onSendNow && (
                                    <Button
                                        onClick={handleSendNow}
                                        variant="default"
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Now
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
