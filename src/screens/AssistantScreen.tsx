import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { askVenueAssistant, getGroqApiKey } from '../lib/venueAssistant';
import { supabase } from '../lib/supabase';
import type { PlacesStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import type { Place } from '../types/place';

type Props = NativeStackScreenProps<PlacesStackParamList, 'Assistant'>;

export function AssistantScreen({ navigation }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [suggestedIds, setSuggestedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = Boolean(getGroqApiKey());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: qErr } = await supabase.from('places').select('*').order('name');
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setPlaces([]);
      } else {
        setPlaces((data as Place[]) ?? []);
      }
      setLoadingPlaces(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(async () => {
    const q = question.trim();
    if (!q) {
      setError('Bir soru yaz.');
      return;
    }
    if (!hasKey) {
      setError('Groq API anahtarı tanımlı değil (.env).');
      return;
    }
    if (places.length === 0) {
      setError('Öneri için önce mekân listesi yüklenmeli.');
      return;
    }
    setError(null);
    setReply(null);
    setSuggestedIds([]);
    setSubmitting(true);
    try {
      const result = await askVenueAssistant(q, places);
      setReply(result.message);
      setSuggestedIds(result.place_ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  }, [question, hasKey, places]);

  const suggestedPlaces = suggestedIds
    .map((id) => places.find((p) => p.id === id))
    .filter((p): p is Place => p != null);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.lead}>
          Ne aradığını yaz; öneriler yalnızca veritabanındaki mekânlardan gelir (hayvan dostu,
          ilçe, tür vb.).
        </Text>

        {!hasKey ? (
          <Text style={styles.warn}>
            Bu özellik için kök dizindeki .env dosyasına{' '}
            <Text style={styles.mono}>EXPO_PUBLIC_GROQ_API_KEY</Text> ekleyip Metro’yu yeniden
            başlat.
          </Text>
        ) : null}

        {loadingPlaces ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <Text style={styles.meta}>{places.length} mekân bağlam olarak kullanılıyor.</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Örn: Konyaaltı’nda hayvan dostu kahve içebileceğim yer?"
          placeholderTextColor={colors.textMuted}
          value={question}
          onChangeText={setQuestion}
          multiline
          editable={!submitting}
        />

        <Pressable
          style={[styles.primaryBtn, submitting && styles.btnDisabled]}
          onPress={submit}
          disabled={submitting || !hasKey}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.primaryBtnText}>Sor</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        {reply ? (
          <View style={styles.replyBox}>
            <Text style={styles.replyTitle}>Yanıt</Text>
            <Text style={styles.replyBody}>{reply}</Text>
          </View>
        ) : null}

        {suggestedPlaces.length > 0 ? (
          <>
            <Text style={styles.listTitle}>Önerilen mekânlar</Text>
            {suggestedPlaces.map((item) => (
              <Pressable
                key={item.id}
                style={styles.row}
                onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>
                    {item.district ?? ''}
                    {item.pet_friendly ? ' · Hayvan dostu' : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 12,
  },
  warn: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 12,
    lineHeight: 20,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  err: {
    color: colors.primary,
    marginBottom: 12,
    fontSize: 14,
  },
  replyBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
  },
  replyBody: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
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
  },
});
