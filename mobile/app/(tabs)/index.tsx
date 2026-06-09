import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { getProducts } from '../../lib/data';
import { Product } from '../../lib/types';
import { ProductCard } from '../../components/ProductCard';

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      const all = await getProducts();
      const featuredOnes = all.filter(p => p.featured).slice(0, 6);
      setFeatured(featuredOnes.length > 0 ? featuredOnes : all.slice(0, 6));
    };
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTag}>CURATED IN NIGERIA</Text>
          <Text style={styles.heroTitle}>TIMELESS.{'\n'}THRIFTED.{'\n'}YOUR STYLE.</Text>
          <Text style={styles.heroSubtitle}>
            Premium pre-loved fashion. Carefully selected pieces from the best brands.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/shop')}>
              <Text style={styles.primaryBtnText}>SHOP THE COLLECTION</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.outlineBtn} 
              onPress={() => Linking.openURL('https://wa.me/2348012345678?text=Hi%20Zara%20Thrift')}
            >
              <Text style={styles.outlineBtnText}>TALK TO US ON WHATSAPP</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroFooter}>LAGOS - ABUJA - DELIVERY NATIONWIDE</Text>
        </View>
      </View>

      <View style={styles.trustBar}>
        <Text style={styles.trustText}>QUALITY CHECKED - AUTHENTIC BRANDS - 7-DAY RETURN POLICY ON MOST PIECES</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTag}>THIS WEEK</Text>
            <Text style={styles.sectionTitle}>Featured Pieces</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/shop')}>
            <Text style={styles.viewAll}>VIEW ALL &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>

        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/shop')}>
          <Text style={styles.browseBtnText}>BROWSE THE FULL COLLECTION</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.howSection}>
        <Text style={styles.howTitle}>HOW ZARA THRIFT WORKS</Text>
        <View style={styles.steps}>
          {[
            { num: '1', title: 'Browse & Select', desc: 'High-quality photos + detailed measurements of every piece.' },
            { num: '2', title: 'Pay to Moniepoint', desc: 'Manual transfer to our Moniepoint account. Fast & secure.' },
            { num: '3', title: 'We Deliver', desc: 'Nationwide delivery. Lagos same-day / next-day options available.' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{step.num}</Text></View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>Ready to find your next favorite piece?</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/shop')}>
          <Text style={styles.primaryBtnText}>START SHOPPING</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          (c) {new Date().getFullYear()} Zara Thrift. Not affiliated with Zara. Premium pre-loved fashion in Nigeria.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingBottom: 40 },
  hero: {
    height: 380,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  heroContent: { alignItems: 'center', zIndex: 1 },
  heroTag: { color: '#888', fontSize: 11, letterSpacing: 3, marginBottom: 12 },
  heroTitle: { 
    color: '#fff', 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    lineHeight: 32, 
    letterSpacing: -1 
  },
  heroSubtitle: { 
    color: '#aaa', 
    fontSize: 13, 
    textAlign: 'center', 
    marginTop: 8, 
    marginBottom: 20, 
    maxWidth: 260 
  },
  heroButtons: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 3,
  },
  primaryBtnText: { color: '#0a0a0a', fontWeight: '600', fontSize: 11, letterSpacing: 0.5 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#f5f5f5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
  },
  outlineBtnText: { color: '#f5f5f5', fontWeight: '500', fontSize: 13, letterSpacing: 1 },
  heroFooter: { color: '#555', fontSize: 10, letterSpacing: 2, marginTop: 32 },

  trustBar: {
    backgroundColor: '#000',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  trustText: { color: '#888', fontSize: 10, textAlign: 'center', letterSpacing: 1 },

  section: { padding: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  sectionTag: { color: '#888', fontSize: 9, letterSpacing: 1 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  viewAll: { color: '#ccc', fontSize: 12 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  browseBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 3,
  },
  browseBtnText: { color: '#f5f5f5', fontSize: 11, letterSpacing: 1 },

  howSection: { backgroundColor: '#000', padding: 20, paddingVertical: 32 },
  howTitle: { color: '#888', fontSize: 11, letterSpacing: 3, textAlign: 'center', marginBottom: 20 },
  steps: { gap: 24 },
  step: { alignItems: 'center' },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumText: { color: '#0a0a0a', fontWeight: '700' },
  stepTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  stepDesc: { color: '#888', fontSize: 13, textAlign: 'center', paddingHorizontal: 12 },

  cta: { padding: 32, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 20 },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#222', alignItems: 'center' },
  footerText: { color: '#555', fontSize: 11, textAlign: 'center', marginBottom: 4 },
});
