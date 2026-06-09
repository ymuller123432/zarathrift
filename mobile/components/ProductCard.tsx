import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Product } from '../lib/types';
import { formatPrice } from '../lib/data';

export function ProductCard({ product }: { product: Product }) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <Image 
        source={{ uri: product.images?.[0] || 'https://picsum.photos/id/1011/400/400' }} 
        style={styles.image} 
      />
      <View style={styles.content}>
        <Text style={styles.brand} numberOfLines={1}>{product.originalBrand || 'PRE-LOVED'}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{product.size} / {product.condition}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: '#222',
  },
  content: {
    padding: 10,
  },
  brand: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    color: '#f5f5f5',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 2,
  },
  price: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
  },
  metaText: {
    color: '#666',
    fontSize: 11,
  },
});
