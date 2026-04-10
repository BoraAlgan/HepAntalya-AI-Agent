import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { RootTabParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import type { Place } from '../types/place';

type FavEmbedRow = { place_id: string; places: Place | Place[] | null };

async function fetchFavoritePlaces(
  userId: string
): Promise<{ data: Place[]; error: string | null }> {
  const embedded = await supabase
    .from('favorites')
    .select('place_id, places(*)')
    .eq('user_id', userId);

  if (!embedded.error && embedded.data != null) {
    if (embedded.data.length === 0) return { data: [], error: null };
    const rows = embedded.data as FavEmbedRow[];
    const out: Place[] = [];
    for (const row of rows) {
      const p = row.places;
      if (p && !Array.isArray(p)) out.push(p);
      else if (Array.isArray(p) && p[0]) out.push(p[0]);
    }
    if (out.length === rows.length) return { data: out, error: null };
  }

  const { data: favs, error: favErr } = await supabase
    .from('favorites')
    .select('place_id')
    .eq('user_id', userId);

  if (favErr) return { data: [], error: favErr.message };
  if (!favs?.length) return { data: [], error: null };

  const ids = favs.map((f) => f.place_id as string);
  const { data: places, error: placesErr } = await supabase
    .from('places')
    .select('*')
    .in('id', ids);

  if (placesErr) return { data: [], error: placesErr.message };
  if (!places?.length) return { data: [], error: null };

  const map = new Map((places as Place[]).map((p) => [p.id, p]));
  const ordered = ids.map((id) => map.get(id)).filter((p): p is Place => p != null);
  return { data: ordered, error: null };
}

export function FavoritesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { user, loading: authLoading } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setPlaces([]);
      setError(null);
      return;
    }
    setError(null);
    const { data, error: fetchErr } = await fetchFavoritePlaces(user.id);
    if (fetchErr) {
      setError(fetchErr);
      setPlaces([]);
    } else {
      setPlaces(data);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) return;
      if (!user?.id) {
        setPlaces([]);
        setError(null);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      load().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [authLoading, user?.id, load])
  );

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [user?.id, load]);

  const goAccount = () => navigation.navigate('AccountTab');
  const goPlace = (placeId: string) =>
    navigation.navigate('PlacesTab', {
      screen: 'PlaceDetail',
      params: { placeId },
    });

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.guest}>
          <Text style={styles.screenTitle}>Favoriler</Text>
          <Text style={styles.guestText}>
            Beğendiğin mekanları burada görmek için giriş yapmalısın.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={goAccount}>
            <Text style={styles.primaryBtnText}>Hesap sekmesine git</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Favoriler yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.guest}>
          <Text style={styles.screenTitle}>Favoriler</Text>
          <Text style={styles.formError}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={() => load()}>
            <Text style={styles.primaryBtnText}>Yeniden dene</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeScreen} edges={['top']}>
      <Text style={styles.listTitle}>Favoriler</Text>
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          places.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz beğenilen mekan bulunmamaktadır</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => goPlace(item.id)}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh]}>
                <Text style={styles.thumbPhText}>—</Text>
              </View>
            )}
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.name}
              </Text>
              {item.district ? (
                <Text style={styles.rowSub} numberOfLines={1}>
                  {item.district}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeScreen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  muted: {
    color: colors.textMuted,
    marginTop: 8,
  },
  guest: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  guestText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  formError: {
    color: colors.primary,
    marginBottom: 16,
    fontSize: 14,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  thumbPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPhText: {
    color: colors.textMuted,
    fontSize: 18,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: 8,
  },
});
