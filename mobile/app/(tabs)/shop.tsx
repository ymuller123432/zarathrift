import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProducts } from '../../lib/data';
import { Product } from '../../lib/types';
import { ProductCard } from '../../components/ProductCard';
import { categories, genders, conditions } from '../../lib/products';

export default function Shop() {
  const insets = useSafeAreaInsets();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState<'All' | string>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | string>('All');
  const [sort, setSort] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  useEffect(() => {
    const load = async () => {
      const prods = await getProducts();
      setAllProducts(prods);
    };
    load();
  }, []);

  useEffect(() => {
    let result = [...allProducts];

    if (selectedGender !== 'All') {
      result = result.filter(p => p.gender === selectedGender);
    }
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (selectedCondition !== 'All') {
      result = result.filter(p => p.condition === selectedCondition);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.originalBrand && p.originalBrand.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') result.sort((a, b) => b.price - a.price);

    setFiltered(result);
  }, [allProducts, search, selectedGender, selectedCategory, selectedCondition, sort]);

  const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Search pieces, brands..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>GENDER</Text>
          <View style={styles.chips}>
            {genders.map(g => (
              <FilterChip key={g} label={g} active={selectedGender === g} onPress={() => setSelectedGender(g)} />
            ))}
          </View>
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>CATEGORY</Text>
          <View style={styles.chips}>
            {categories.map(c => (
              <FilterChip key={c} label={c} active={selectedCategory === c} onPress={() => setSelectedCategory(c)} />
            ))}
          </View>
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>CONDITION</Text>
          <View style={styles.chips}>
            {conditions.map(c => (
              <FilterChip key={c} label={c} active={selectedCondition === c} onPress={() => setSelectedCondition(c)} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.sortRow}>
        <Text style={styles.results}>{filtered.length} pieces</Text>
        <View style={styles.sortBtns}>
          <TouchableOpacity onPress={() => setSort('newest')} style={[styles.sortBtn, sort === 'newest' && styles.sortActive]}>
            <Text style={[styles.sortText, sort === 'newest' && styles.sortTextActive]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSort('price-low')} style={[styles.sortBtn, sort === 'price-low' && styles.sortActive]}>
            <Text style={[styles.sortText, sort === 'price-low' && styles.sortTextActive]}>Price Low</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSort('price-high')} style={[styles.sortBtn, sort === 'price-high' && styles.sortActive]}>
            <Text style={[styles.sortText, sort === 'price-high' && styles.sortTextActive]}>Price High</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No pieces match your filters.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: '#111',
    color: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#222',
  },
  filterScroll: { paddingLeft: 16, marginBottom: 4 },
  filterGroup: { marginRight: 24, paddingBottom: 8 },
  filterLabel: { color: '#666', fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
  },
  chipActive: { backgroundColor: '#f5f5f5', borderColor: '#f5f5f5' },
  chipText: { color: '#ccc', fontSize: 11 },
  chipTextActive: { color: '#0a0a0a', fontWeight: '600' },

  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 4, marginBottom: 4 },
  results: { color: '#888', fontSize: 12 },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3, backgroundColor: '#111' },
  sortActive: { backgroundColor: '#222' },
  sortText: { color: '#888', fontSize: 11 },
  sortTextActive: { color: '#f5f5f5' },

  gridRow: { gap: 8, justifyContent: 'space-between' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
