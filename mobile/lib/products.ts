import { Product, DiscountCode } from './types';

export const products: Product[] = [
  {
    id: 'p1',
    name: "Levi's 501 Straight Jeans",
    price: 12500,
    originalBrand: "Levi's",
    size: '32',
    condition: 'Excellent',
    gender: 'Men',
    category: 'Bottoms',
    description: 'Classic vintage Levi 501. Minimal fading, perfect fit. Timeless staple.',
    images: ['https://picsum.photos/id/1011/800/800', 'https://picsum.photos/id/160/800/800'],
    measurements: 'Waist 32", Inseam 32", Rise 11"',
    material: '100% Cotton Denim',
    featured: true,
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
    description: 'Luxurious silk blouse with subtle sheen. Perfect for work or evening.',
    images: ['https://picsum.photos/id/1005/800/800'],
    measurements: 'Bust 36", Length 26"',
    material: '100% Silk',
    featured: true,
  },
  {
    id: 'p3',
    name: 'Oversized Wool Blazer',
    price: 14500,
    originalBrand: 'Zara',
    size: 'L',
    condition: 'Good',
    gender: 'Unisex',
    category: 'Outerwear',
    description: 'Structured wool-blend blazer. Slightly oversized fit.',
    images: ['https://picsum.photos/id/201/800/800'],
    measurements: 'Chest 42", Length 30"',
    material: 'Wool Blend',
    featured: true,
  },
  {
    id: 'p4',
    name: 'High-Waist Wide Leg Trousers',
    price: 9200,
    originalBrand: 'H&M',
    size: 'S',
    condition: 'Excellent',
    gender: 'Women',
    category: 'Bottoms',
    description: 'Elegant high-waist trousers with flowy wide leg.',
    images: ['https://picsum.photos/id/106/800/800'],
    measurements: 'Waist 26", Inseam 30"',
    material: 'Polyester Blend',
  },
];

export const seedDiscounts: DiscountCode[] = [
  { code: 'THRIFT10', percent: 10, active: true },
  { code: 'ZARA20', percent: 20, active: true },
];

export const genders = ['All', 'Men', 'Women', 'Unisex', 'Kids'];
export const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories'];
export const conditions = ['All', 'Excellent', 'Good', 'Fair'];
