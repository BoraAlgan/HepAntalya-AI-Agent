import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';

import { HeaderIconButton } from '../components/HeaderIconButton';
import { AccountScreen } from '../screens/AccountScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { PlaceDetailScreen } from '../screens/PlaceDetailScreen';
import { PlacesListScreen } from '../screens/PlacesListScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { colors } from '../theme/colors';
import type { PlacesStackParamList, RootTabParamList } from './types';

const PlacesStack = createNativeStackNavigator<PlacesStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function PlacesStackNavigator() {
  return (
    <PlacesStack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <PlacesStack.Screen
        name="PlacesList"
        component={PlacesListScreen}
        options={({ navigation }) => ({
          title: 'Mekanlar',
          headerRightContainerStyle: styles.headerSideRight,
          headerRight: () => (
            <HeaderIconButton
              onPress={() => navigation.navigate('Assistant')}
              accessibilityLabel="AI ile mekân sor"
            >
              <Ionicons name="sparkles" size={24} color={colors.primary} />
            </HeaderIconButton>
          ),
        })}
      />
      <PlacesStack.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{ title: 'AI asistan' }}
      />
      <PlacesStack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={({ navigation }) => ({
          title: 'Mekan',
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
          headerBackButtonMenuEnabled: false,
          headerLeftContainerStyle: styles.headerSideLeft,
          headerRightContainerStyle: styles.headerSideRight,
          headerLeft: () => (
            <HeaderIconButton onPress={() => navigation.goBack()} accessibilityLabel="Geri">
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </HeaderIconButton>
          ),
        })}
      />
    </PlacesStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.background },
        }}
      >
        <Tab.Screen
          name="PlacesTab"
          component={PlacesStackNavigator}
          options={{
            tabBarLabel: 'Mekanlar',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'restaurant' : 'restaurant-outline'}
                size={size ?? 24}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="FavoritesTab"
          component={FavoritesScreen}
          options={{
            tabBarLabel: 'Favoriler',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size ?? 24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="AccountTab"
          component={AccountScreen}
          options={{
            tabBarLabel: 'Hesap',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size ?? 24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerSideLeft: {
    paddingLeft: Platform.OS === 'ios' ? 4 : 0,
  },
  headerSideRight: {
    paddingRight: Platform.OS === 'ios' ? 4 : 0,
  },
});
