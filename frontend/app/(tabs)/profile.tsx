import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleMyRecipes = () => {
    router.push('/my-recipes' as any);
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Choose an option:',
      [
        {
          text: 'Change Password',
          onPress: () => Alert.alert('Coming Soon', 'Password change feature will be available soon')
        },
        {
          text: 'Notification Settings',
          onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon')
        },
        {
          text: 'Privacy Settings',
          onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleHelpSupport = () => {
    const email = 'naitikjain921@gmail.com';
    const subject = 'Recipe App Support Request';
    const body = 'Hi, I need help with...';
    
    Alert.alert(
      'Contact Support',
      'How would you like to reach us?',
      [
        {
          text: 'Email',
          onPress: () => {
            const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Unable to open email app');
            });
          }
        },
        {
          text: 'Copy Email',
          onPress: () => {
            Alert.alert('Email Copied', `${email}\n\nYou can paste this email address in your email app.`);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Recipe App',
      'Version 1.0.0\n\nA beautiful recipe collection app to discover, save, and share your favorite recipes.\n\nDeveloped with ❤️',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace('/');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#2C5F6F" />
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={handleMyRecipes} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="book-outline" size={24} color="#2C5F6F" />
            <Text style={styles.menuText}>My Recipes</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#B0A99F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSettings} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="settings-outline" size={24} color="#2C5F6F" />
            <Text style={styles.menuText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#B0A99F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#2C5F6F" />
            <Text style={styles.menuText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#B0A99F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAbout} activeOpacity={0.7}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="information-circle-outline" size={24} color="#2C5F6F" />
            <Text style={styles.menuText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#B0A99F" />
        </TouchableOpacity>
      </View>

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.9}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    letterSpacing: -0.5,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: '#8B7355',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F6F4',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  logoutSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#B0A99F',
    marginTop: 24,
  },
});
