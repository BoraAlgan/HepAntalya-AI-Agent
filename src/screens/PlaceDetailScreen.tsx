import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { HeaderIconButton } from '../components/HeaderIconButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { PlacesStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import type { Place } from '../types/place';

type Props = NativeStackScreenProps<PlacesStackParamList, 'PlaceDetail'>;

export function PlaceDetailScreen({ route, navigation }: Props) {
  const { placeId } = route.params;
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: qErr } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (qErr) {
      if (qErr.code === 'PGRST116') {
        setPlace(null);
        setError('Mekan bulunamadı.');
      } else {
        setPlace(null);
        setError(qErr.message);
      }
      return;
    }

    setPlace(data as Place);
    setImgErr(false);
  }, [placeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    navigation.setOptions({
      title: place?.name ?? 'Mekan',
      headerTitleAlign: 'center',
    });
  }, [navigation, place?.name]);

  useEffect(() => {
    if (!userId) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('place_id')
        .eq('user_id', userId)
        .eq('place_id', placeId)
        .maybeSingle();
      if (!cancelled) setIsFavorite(Boolean(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, placeId]);

  const toggleFavorite = useCallback(async () => {
    if (!userId || !place) return;
    setFavError(null);
    setFavBusy(true);
    if (isFavorite) {
      const { error: delErr } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('place_id', place.id);
      if (delErr) setFavError(delErr.message);
      else setIsFavorite(false);
    } else {
      const { error: insErr } = await supabase
        .from('favorites')
        .insert({ user_id: userId, place_id: place.id });
      if (insErr) setFavError(insErr.message);
      else setIsFavorite(true);
    }
    setFavBusy(false);
  }, [userId, place, isFavorite]);

  const handleHeartPress = useCallback(() => {
    if (!place) return;
    if (!userId) {
      navigation.getParent()?.navigate('AccountTab');
      return;
    }
    void toggleFavorite();
  }, [place, userId, navigation, toggleFavorite]);

  useLayoutEffect(() => {
    if (!place || loading || error) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          onPress={handleHeartPress}
          disabled={favBusy}
          accessibilityLabel={
            !userId
              ? 'Favori için giriş yap'
              : isFavorite
                ? 'Favorilerden çıkar'
                : 'Favorilere ekle'
          }
        >
          <Ionicons
            name={userId && isFavorite ? 'heart' : 'heart-outline'}
            size={26}
            color={colors.primary}
          />
        </HeaderIconButton>
      ),
    });
  }, [navigation, place, loading, error, userId, isFavorite, favBusy, handleHeartPress]);

  const retry = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Yükleniyor…</Text>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{error ?? 'Mekan bulunamadı.'}</Text>
        <Pressable style={styles.retryBtn} onPress={retry}>
          <Text style={styles.retryText}>Yeniden dene</Text>
        </Pressable>
      </View>
    );
  }

  const showImage = Boolean(place.image_url) && !imgErr;
  const locationLine = [place.district, place.address].filter(Boolean).join(' · ') || null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {showImage ? (
        <Image
          source={{ uri: place.image_url! }}
          style={styles.hero}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={styles.heroPlaceholderText}>Görsel yok</Text>
        </View>
      )}

      <View style={styles.body}>
        {place.kind_label ? (
          <Text style={styles.kind}>{place.kind_label}</Text>
        ) : null}
        {place.category ? <Text style={styles.category}>{place.category}</Text> : null}

        {locationLine ? <Text style={styles.location}>{locationLine}</Text> : null}

        {place.pet_friendly === true ? (
          <View style={styles.petPill}>
            <Text style={styles.petPillText}>Hayvan dostu mekân</Text>
          </View>
        ) : null}

        <View style={styles.ratingRow}>
          <Text style={styles.stars}>
            ★ {place.rating != null ? place.rating.toFixed(1) : '—'}
          </Text>
          <Text style={styles.reviews}>({place.review_count ?? 0} değerlendirme)</Text>
        </View>

        {place.description ? (
          <Text style={styles.description}>{place.description}</Text>
        ) : (
          <Text style={styles.descriptionMuted}>Açıklama eklenmemiş.</Text>
        )}

        {favError ? <Text style={styles.favError}>{favError}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
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
    fontSize: 16,
    color: colors.text,
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
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  body: {
    padding: 20,
    gap: 8,
  },
  kind: {
    fontSize: 15,
    color: colors.textMuted,
  },
  category: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  location: {
    fontSize: 15,
    color: colors.text,
  },
  petPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  petPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stars: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  reviews: {
    fontSize: 15,
    color: colors.textMuted,
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  descriptionMuted: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  favError: {
    marginTop: 8,
    fontSize: 13,
    color: colors.primary,
  },
});
