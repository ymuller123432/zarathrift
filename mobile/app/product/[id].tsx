import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getProducts, getCart, saveCart, formatPrice } from '../../lib/data';
import { Product, CartItem } from '../../lib/types';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const load = async () => {
      const all = await getProducts();
      const found = all.find(p => p.id === id);
      if (found) {
        setProduct(found);
        const sim = all
          .filter(p => p.id !== id && (p.category === found.category || p.gender === found.gender))
          .slice(0, 4);
        setSimilar(sim);
      }
    };
    load();
  }, [id]);

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: '#888' }}>Loading item...</Text>
      </View>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : ['https://picsum.photos/id/1011/800/800'];

  const addToCart = async () => {
    const cart = await getCart();
    const existing = cart.findIndex((c: CartItem) => c.id === product.id);

    let newCart: CartItem[];
    if (existing >= 0) {
      newCart = [...cart];
      newCart[existing] = { ...newCart[existing], quantity: (newCart[existing].quantity || 1) + qty };
    } else {
      newCart = [...cart, { ...product, quantity: qty }];
    }
    await saveCart(newCart);
    Alert.alert('Added to cart', `${qty} x ${product.name}`, [
      { text: 'Continue shopping', style: 'cancel' },
      { text: 'View cart', onPress: () => router.push('/cart') },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View>
        <Image source={{ uri: images[selectedImage] }} style={styles.mainImage} resizeMode="cover" />
        {images.length > 1 && (
          <ScrollView horizontal style={styles.thumbRow} showsHorizontalScrollIndicator={false}>
            {images.map((img, idx) => (
              <TouchableOpacity key={idx} onPress={() => setSelectedImage(idx)}>
                <Image
                  source={{ uri: img }}
                  style={[styles.thumb, selectedImage === idx && styles.thumbActive]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.brand}>{product.originalBrand || 'PRE-LOVED'}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>

        <View style={styles.meta}>
          <View style={styles.metaPill}><Text style={styles.metaText}>{product.size}</Text></View>
          <View style={styles.metaPill}><Text style={styles.metaText}>{product.condition}</Text></View>
          <View style={styles.metaPill}><Text style={styles.metaText}>{product.gender}</Text></View>
          <View style={styles.metaPill}><Text style={styles.metaText}>{product.category}</Text></View>
        </View>

        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <Text style={styles.description}>{product.description}</Text>

        {product.measurements && (
          <>
            <Text style={styles.sectionLabel}>MEASUREMENTS</Text>
            <Text style={styles.measure}>{product.measurements}</Text>
          </>
        )}
        {product.material && (
          <>
            <Text style={styles.sectionLabel}>MATERIAL</Text>
            <Text style={styles.measure}>{product.material}</Text>
          </>
        )}

        <View style={styles.actionRow}>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
            <Text style={styles.qtyValue}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
            <Text style={styles.addBtnText}>ADD TO CART</Text>
          </TouchableOpacity>
        </View>

        {similar.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>YOU MAY ALSO LIKE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {similar.map(s => (
                <TouchableOpacity key={s.id} style={styles.similarCard} onPress={() => router.push(`/product/${s.id}`)}>
                  <Image source={{ uri: s.images?.[0] }} style={styles.similarImg} />
                  <Text style={styles.similarName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.similarPrice}>{formatPrice(s.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backText}>BACK TO SHOP</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loading: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  mainImage: { width: '100%', height: width * 0.9, backgroundColor: '#111' },
  thumbRow: { padding: 8, backgroundColor: '#000' },
  thumb: { width: 52, height: 52, marginRight: 6, borderRadius: 3, borderWidth: 1.5, borderColor: '#222' },
  thumbActive: { borderColor: '#f5f5f5' },

  content: { padding: 20 },
  brand: { color: '#888', fontSize: 11, letterSpacing: 2 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2, letterSpacing: -0.2 },
  price: { color: '#f5f5f5', fontSize: 16, fontWeight: '700', marginTop: 4 },

  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaPill: { backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3 },
  metaText: { color: '#ccc', fontSize: 12 },

  sectionLabel: { color: '#888', fontSize: 10, letterSpacing: 2, marginTop: 20, marginBottom: 6 },
  description: { color: '#ddd', fontSize: 14, lineHeight: 21 },
  measure: { color: '#ccc', fontSize: 13 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 28, alignItems: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 4, borderWidth: 1, borderColor: '#222' },
  qtyBtn: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#f5f5f5', fontSize: 20, fontWeight: '300' },
  qtyValue: { color: '#f5f5f5', fontSize: 16, width: 28, textAlign: 'center' },
  addBtn: { flex: 1, backgroundColor: '#f5f5f5', paddingVertical: 10, borderRadius: 3, alignItems: 'center' },
  addBtnText: { color: '#0a0a0a', fontWeight: '700', letterSpacing: 0.5, fontSize: 12 },

  similarCard: { width: 110, marginRight: 8, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  similarImg: { width: '100%', height: 85 },
  similarName: { color: '#f5f5f5', fontSize: 12, padding: 8, paddingBottom: 2 },
  similarPrice: { color: '#aaa', fontSize: 13, fontWeight: '600', paddingHorizontal: 8, paddingBottom: 8 },

  backLink: { marginTop: 32, alignSelf: 'center' },
  backText: { color: '#666', fontSize: 12, letterSpacing: 1 },
});
