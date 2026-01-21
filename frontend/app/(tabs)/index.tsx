import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const categories = [
  { id: 'all', name: 'All Recipes', icon: 'grid' },
  { id: 'veg', name: 'Vegetarian', icon: 'leaf' },
  { id: 'non-veg', name: 'Non-Veg', icon: 'restaurant' },
  { id: 'dessert', name: 'Desserts', icon: 'ice-cream' },
  { id: 'fast-food', name: 'Fast Food', icon: 'fast-food' },
];

export default function BrowseRecipes() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [])
  );

  useEffect(() => {
    filterRecipes();
  }, [selectedCategory, recipes]);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/recipes`);
      setRecipes(response.data);
      setFilteredRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;
    if (selectedCategory !== 'all') {
      filtered = recipes.filter(recipe => recipe.category === selectedCategory);
    }
    setFilteredRecipes(filtered);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      filterRecipes();
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/recipes/search?q=${searchQuery}`);
      setFilteredRecipes(response.data);
    } catch (error) {
      console.error('Error searching recipes:', error);
    }
  };

  const renderRecipeCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/recipe/${item.id}`)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.recipeImage} />
      <View style={styles.cardOverlay}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.recipeMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#8B7355" />
            <Text style={styles.metaText}>{item.cooking_time}</Text>
          </View>
          <View style={styles.difficultyDot} />
          <Text style={styles.metaText}>{item.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2C5F6F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Culinary inspiration awaits</Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8B7355" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes or ingredients..."
            placeholderTextColor="#B0A99F"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              filterRecipes();
            }}>
              <Ionicons name="close-circle" size={20} color="#B0A99F" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={selectedCategory === item.id ? '#FFFFFF' : '#8B7355'}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#E0DDD9" />
          <Text style={styles.emptyText}>No recipes found</Text>
          <Text style={styles.emptySubtext}>Try a different search or category</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipesList}
          numColumns={2}
          columnWrapperStyle={styles.recipeRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F4',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F4',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F8F6F4',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2C5F6F',
  },
  categoryText: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  recipesList: {
    padding: 20,
  },
  recipeRow: {
    justifyContent: 'space-between',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    width: '48%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recipeImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E0DDD9',
  },
  cardOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#2C5F6F',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 20,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8B7355',
  },
  difficultyDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E0DDD9',
    marginHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B6B6B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0A99F',
    marginTop: 8,
  },
});
