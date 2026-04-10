import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import type { PlacesStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import type { Place } from '../types/place';

type CategoryPill = 'all' | 'restoran' | 'kafe';

const PILLS: { key: CategoryPill; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'restoran', label: 'Restoran' },
  { key: 'kafe', label: 'Kafe' },
];

function matchesCategory(place: Place, pill: CategoryPill): boolean {
  if (pill === 'all') return true;
  const raw = (place.category ?? '').toLowerCase().trim();
  if (pill === 'restoran') {
    return raw.includes('restoran') || raw === 'restaurant';
  }
  if (pill === 'kafe') {
    return raw.includes('kafe') || raw.includes('cafe') || raw.includes('kahve');
  }
  return true;
}

function matchesSearch(place: Place, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = (place.name ?? '').toLowerCase();
  const district = (place.district ?? '').toLowerCase();
  return name.includes(q) || district.includes(q);
}

function matchesPetFriendly(place: Place, onlyPetFriendly: boolean): boolean {
  if (!onlyPetFriendly) return true;
  return place.pet_friendly === true;
}

export function PlacesListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PlacesStackParamList, 'PlacesList'>>();
  const [rows, setRows] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pill, setPill] = useState<CategoryPill>('all');
  const [search, setSearch] = useState('');
  const [onlyPetFriendly, setOnlyPetFriendly] = useState(false);

  const fetchPlaces = useCallback(async () => {
    setError(null);
    const { data, error: qErr } = await supabase.from('places').select('*').order('name');
    if (qErr) {
      setError(qErr.message);
      setRows([]);
      return;
    }
    setRows((data as Place[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchPlaces();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPlaces]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlaces();
    setRefreshing(false);
  }, [fetchPlaces]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (p) =>
          matchesCategory(p, pill) &&
          matchesSearch(p, search) &&
          matchesPetFriendly(p, onlyPetFriendly)
      ),
    [rows, pill, search, onlyPetFriendly]
  );

  const retry = useCallback(async () => {
    setError(null);
    setLoading(true);
    await fetchPlaces();
    setLoading(false);
  }, [fetchPlaces]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Mekanlar yükleniyor…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Yüklenemedi</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={retry}>
          <Text style={styles.retryText}>Yeniden dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <PillRow selected={pill} onChange={setPill} />
      <View style={styles.petRow}>
        <Text style={styles.petLabel}>Hayvan dostu</Text>
        <Switch
          value={onlyPetFriendly}
          onValueChange={setOnlyPetFriendly}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.background}
        />
      </View>
      <TextInput
        style={styles.search}
        placeholder="İsim veya ilçe ara…"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyListContent : styles.listContent
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {rows.length === 0
              ? 'Henüz mekan bulunmuyor.'
              : 'Filtrelere uygun mekan yok.'}
          </Text>
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
          <PlaceCard
            place={item}
            onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
          />
        )}
      />
    </View>
  );
}

function PillRow({
  selected,
  onChange,
}: {
  selected: CategoryPill;
  onChange: (p: CategoryPill) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.pillScroll}
      contentContainerStyle={styles.pillRow}
    >
      {PILLS.map((p) => {
        const active = selected === p.key;
        return (
          <Pressable
            key={p.key}
            onPress={() => onChange(p.key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{p.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function PlaceCard({ place, onPress }: { place: Place; onPress: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const showImage = Boolean(place.image_url) && !imgErr;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {showImage ? (
        <Image
          source={{ uri: place.image_url! }}
          style={styles.thumb}
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbPlaceholderText}>📍</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {place.name}
          </Text>
          {place.pet_friendly === true ? (
            <View style={styles.petBadge}>
              <Text style={styles.petBadgeText}>Hayvan dostu</Text>
            </View>
          ) : null}
        </View>
        {place.kind_label ? (
          <Text style={styles.kind} numberOfLines={1}>
            {place.kind_label}
          </Text>
        ) : null}
        <Text style={styles.location} numberOfLines={1}>
          {place.district ?? place.address ?? 'Konum bilgisi yok'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.stars}>
            ★ {place.rating != null ? place.rating.toFixed(1) : '—'}
          </Text>
          <Text style={styles.reviews}>({place.review_count ?? 0} değerlendirme)</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  muted: {
    color: colors.textMuted,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  errorBody: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.background,
    fontWeight: '600',
  },
  pillScroll: {
    flexGrow: 0,
    minHeight: 56,
  },
  pillRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
  },
  pill: {
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillLabel: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
  },
  pillLabelActive: {
    color: colors.background,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  petLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 88,
    height: 88,
    backgroundColor: colors.surface,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 22,
    opacity: 0.35,
  },
  cardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  petBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  petBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  kind: {
    fontSize: 13,
    color: colors.textMuted,
  },
  location: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stars: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviews: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
