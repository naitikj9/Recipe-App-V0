import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MyRecipes() {
  const router = useRouter();
  const [myRecipes, setMyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserAndRecipes();
    }, [])
  );

  const loadUserAndRecipes = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        await fetchMyRecipes(user.id);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRecipes = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/recipes`);
      const userRecipes = response.data.filter((recipe: any) => recipe.created_by === userId);
      setMyRecipes(userRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
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
        <View style={styles.creatorBadge}>
          <Ionicons name="person" size={12} color="#FFFFFF" />
          <Text style={styles.creatorText}>You</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C5F6F" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Recipes</Text>
          <Text style={styles.headerSubtitle}>{myRecipes.length} {myRecipes.length === 1 ? 'recipe' : 'recipes'} created</Text>
        </View>
      </View>

      {myRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="book-outline" size={64} color="#E0DDD9" />
          </View>
          <Text style={styles.emptyText}>No Recipes Yet</Text>
          <Text style={styles.emptySubtext}>Start creating your own recipes and they'll appear here</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/add' as any)}
            activeOpacity={0.9}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Create Recipe</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myRecipes}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F6F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C5F6F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C5F6F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  creatorText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
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
});
