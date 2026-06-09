import { Product } from './types';

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Levi\'s 501 Straight Jeans',
    price: 12500,
    originalBrand: 'Levi\'s',
    size: '32',
    condition: 'Excellent',
    gender: 'Men',
    category: 'Bottoms',
    description: 'Classic vintage Levi\'s 501. Minimal fading, perfect fit. Timeless staple.',
    images: [
      'https://picsum.photos/id/1011/800/800',
      'https://picsum.photos/id/160/800/800',
      'https://picsum.photos/id/201/800/800'
    ],
    measurements: 'Waist 32", Inseam 32", Rise 11"',
    material: '100% Cotton Denim',
    inStock: true,
  },
  {
    id: 'p2',
    name: 'Vintage Silk Blouse',
    price: 6800,
    originalBrand: 'Massimo Dutti',
    size: 'M',
    condition: 'Excellent',
    gender: 'Women',
    category: 'Tops',
    description: 'Luxurious silk blouse with subtle sheen. Perfect for work or evening. Very well maintained.',
    images: [
      'https://picsum.photos/id/1005/800/800',
      'https://picsum.photos/id/1009/800/800'
    ],
    measurements: 'Bust 36", Length 26"',
    material: '100% Silk',
    inStock: true,
  },
  {
    id: 'p3',
    name: 'Oversized Blazer - Wool Blend',
    price: 14500,
    originalBrand: 'Zara',
    size: 'L',
    condition: 'Good',
    gender: 'Unisex',
    category: 'Outerwear',
    description: 'Structured wool-blend blazer. Slightly oversized fit. Minor signs of wear on cuffs.',
    images: [
      'https://picsum.photos/id/106/800/800',
      'https://picsum.photos/id/180/800/800'
    ],
    measurements: 'Shoulders 18", Chest 42", Length 30"',
    material: '80% Wool, 20% Polyester',
    inStock: true,
  },
  {
    id: 'p4',
    name: 'High-Waist Wide Leg Trousers',
    price: 9500,
    originalBrand: 'H&M Studio',
    size: 'S',
    condition: 'Excellent',
    gender: 'Women',
    category: 'Bottoms',
    description: 'Elegant wide-leg trousers. Great drape and structure. Like new.',
    images: [
      'https://picsum.photos/id/251/800/800',
      'https://picsum.photos/id/29/800/800'
    ],
    measurements: 'Waist 26", Inseam 30", Length 42"',
    material: 'Viscose Blend',
    inStock: true,
  },
  {
    id: 'p5',
    name: 'Nike Air Force 1 Low',
    price: 15500,
    originalBrand: 'Nike',
    size: '42',
    condition: 'Good',
    gender: 'Men',
    category: 'Footwear',
    description: 'Classic white AF1. Some creasing on toe box but clean overall. Great everyday kicks.',
    images: [
      'https://picsum.photos/id/20/800/800',
      'https://picsum.photos/id/180/800/800',
      'https://picsum.photos/id/160/800/800'
    ],
    measurements: 'UK 8 / EU 42',
    material: 'Leather & Synthetic',
    inStock: true,
  },
  {
    id: 'p6',
    name: 'Floral Midi Dress',
    price: 7200,
    originalBrand: 'ASOS Design',
    size: 'M',
    condition: 'Excellent',
    gender: 'Women',
    category: 'Dresses',
    description: 'Beautiful lightweight floral print midi. Perfect for events or casual. Very flattering.',
    images: [
      'https://picsum.photos/id/1009/800/800',
      'https://picsum.photos/id/1012/800/800'
    ],
    measurements: 'Bust 36", Waist 29", Length 48"',
    material: '100% Cotton',
    inStock: true,
  },
  {
    id: 'p7',
    name: 'Cashmere Crewneck Sweater',
    price: 8900,
    originalBrand: 'Uniqlo',
    size: 'L',
    condition: 'Good',
    gender: 'Unisex',
    category: 'Tops',
    description: 'Soft premium cashmere. Light pilling but still luxurious. Warm and timeless.',
    images: [
      'https://picsum.photos/id/106/800/800',
      'https://picsum.photos/id/251/800/800'
    ],
    measurements: 'Chest 44", Length 27"',
    material: '100% Cashmere',
    inStock: true,
  },
  {
    id: 'p8',
    name: 'Denim Trucker Jacket',
    price: 10500,
    originalBrand: 'Levi\'s',
    size: 'M',
    condition: 'Excellent',
    gender: 'Men',
    category: 'Outerwear',
    description: 'Iconic trucker in medium wash. Minimal distressing. Perfect layering piece.',
    images: [
      'https://picsum.photos/id/201/800/800',
      'https://picsum.photos/id/160/800/800'
    ],
    measurements: 'Chest 40", Length 25"',
    material: '100% Cotton Denim',
    inStock: true,
  },
  {
    id: 'p9',
    name: 'Leather Chelsea Boots',
    price: 16800,
    originalBrand: 'Clarks',
    size: '41',
    condition: 'Good',
    gender: 'Unisex',
    category: 'Footwear',
    description: 'Genuine leather Chelsea boots. Comfortable and versatile. Some patina on the leather.',
    images: [
      'https://picsum.photos/id/180/800/800',
      'https://picsum.photos/id/20/800/800'
    ],
    measurements: 'UK 7.5 / EU 41',
    material: 'Leather Upper, Rubber Sole',
    inStock: true,
  },
  {
    id: 'p10',
    name: 'Tailored Linen Shirt',
    price: 5500,
    originalBrand: 'J.Crew',
    size: 'XL',
    condition: 'Excellent',
    gender: 'Men',
    category: 'Tops',
    description: 'Breathable linen shirt in a relaxed tailored fit. Perfect for hot weather. Crisp and clean.',
    images: [
      'https://picsum.photos/id/1005/800/800',
      'https://picsum.photos/id/29/800/800'
    ],
    measurements: 'Chest 46", Length 30"',
    material: '100% Linen',
    inStock: true,
  },
  {
    id: 'p11',
    name: 'Pleated Midi Skirt',
    price: 4800,
    originalBrand: 'Zara',
    size: 'S',
    condition: 'Excellent',
    gender: 'Women',
    category: 'Bottoms',
    description: 'Elegant pleated midi skirt. Moves beautifully. Great for both casual and dressed up looks.',
    images: [
      'https://picsum.photos/id/1012/800/800',
      'https://picsum.photos/id/1009/800/800'
    ],
    measurements: 'Waist 26", Length 32"',
    material: 'Polyester Blend',
    inStock: true,
  },
  {
    id: 'p12',
    name: 'Vintage Graphic Hoodie',
    price: 6200,
    originalBrand: 'Champion',
    size: 'L',
    condition: 'Good',
    gender: 'Unisex',
    category: 'Tops',
    description: 'Authentic vintage Champion reverse weave hoodie. Faded graphic but super soft and cozy.',
    images: [
      'https://picsum.photos/id/160/800/800',
      'https://picsum.photos/id/201/800/800'
    ],
    measurements: 'Chest 46", Length 28"',
    material: 'Cotton Fleece',
    inStock: true,
  }
];

export const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories'] as const;
export const genders = ['All', 'Men', 'Women', 'Unisex', 'Kids'] as const;
export const conditions = ['All', 'Excellent', 'Good', 'Fair'] as const;
