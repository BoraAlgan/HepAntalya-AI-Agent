import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

type Mode = 'signin' | 'signup';

export function AccountScreen() {
  const { user, loading, signIn, signUp, signOut, updateDisplayName, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const serverDisplayName = (
    (user?.user_metadata as { display_name?: string } | undefined)?.display_name ?? ''
  ).trim();

  useEffect(() => {
    if (user) setNameDraft(serverDisplayName);
  }, [user?.id, serverDisplayName]);

  const resetMessages = () => {
    setFormError(null);
    setInfoMessage(null);
  };

  const handleSignIn = async () => {
    resetMessages();
    if (!email.trim() || !password) {
      setFormError('E-posta ve şifre gerekli.');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) setFormError(error.message);
  };

  const handleSignUp = async () => {
    resetMessages();
    if (!email.trim() || !password) {
      setFormError('E-posta ve şifre gerekli.');
      return;
    }
    if (password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password, displayName);
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error.message);
      return;
    }
    if (result.needsEmailConfirmation) {
      setInfoMessage(
        'Kayıt alındı. Hesabı kullanmak için e-postanızdaki doğrulama bağlantısına tıklayın.'
      );
      setPassword('');
      setDisplayName('');
    }
  };

  const handleSignOut = async () => {
    resetMessages();
    setSubmitting(true);
    await signOut();
    setSubmitting(false);
  };

  const handleSaveName = async () => {
    setSettingsErr(null);
    setSettingsMsg(null);
    setSavingName(true);
    const { error } = await updateDisplayName(nameDraft);
    setSavingName(false);
    if (error) setSettingsErr(error.message);
    else setSettingsMsg('Görünen ad güncellendi.');
  };

  const handleSavePassword = async () => {
    setSettingsErr(null);
    setSettingsMsg(null);
    if (pwdNew.length < 6) {
      setSettingsErr('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setSettingsErr('Yeni şifreler eşleşmiyor.');
      return;
    }
    setSavingPwd(true);
    const { error } = await updatePassword(pwdNew);
    setSavingPwd(false);
    if (error) setSettingsErr(error.message);
    else {
      setSettingsMsg('Şifre güncellendi.');
      setPwdNew('');
      setPwdConfirm('');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Oturum kontrol ediliyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    const meta = user.user_metadata as { display_name?: string } | undefined;
    const label = meta?.display_name?.trim() || user.email || 'Hesabınız';

    return (
      <SafeAreaView style={styles.safeLogged} edges={['top']}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.loggedScroll}
        >
          <Text style={styles.screenTitle}>Hesap</Text>
          <View style={styles.card}>
            <Text style={styles.welcome}>{label}</Text>
            {user.email ? <Text style={styles.emailMuted}>{user.email}</Text> : null}
            <Pressable
              style={[styles.primaryBtn, submitting && styles.btnDisabled]}
              onPress={handleSignOut}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.primaryBtnText}>Çıkış yap</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profil</Text>
            <Text style={styles.label}>Görünen ad</Text>
            <TextInput
              style={styles.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="İsmin nasıl görünsün?"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!savingName}
            />
            <Pressable
              style={[styles.secondaryBtn, savingName && styles.btnDisabled]}
              onPress={handleSaveName}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.secondaryBtnText}>Adı kaydet</Text>
              )}
            </Pressable>

            <Text style={[styles.sectionTitle, styles.sectionSpaced]}>Şifre</Text>
            <Text style={styles.label}>Yeni şifre</Text>
            <TextInput
              style={styles.input}
              value={pwdNew}
              onChangeText={setPwdNew}
              placeholder="En az 6 karakter"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!savingPwd}
            />
            <Text style={styles.label}>Yeni şifre (tekrar)</Text>
            <TextInput
              style={styles.input}
              value={pwdConfirm}
              onChangeText={setPwdConfirm}
              placeholder="Tekrar gir"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!savingPwd}
            />
            <Pressable
              style={[styles.secondaryBtn, savingPwd && styles.btnDisabled]}
              onPress={handleSavePassword}
              disabled={savingPwd}
            >
              {savingPwd ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.secondaryBtnText}>Şifreyi güncelle</Text>
              )}
            </Pressable>

            {settingsErr ? <Text style={styles.settingsErr}>{settingsErr}</Text> : null}
            {settingsMsg ? <Text style={styles.settingsOk}>{settingsMsg}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.screenTitle}>Hesap</Text>

        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}
            onPress={() => {
              setMode('signin');
              resetMessages();
            }}
          >
            <Text style={[styles.segmentLabel, mode === 'signin' && styles.segmentLabelActive]}>
              Giriş
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
            onPress={() => {
              setMode('signup');
              resetMessages();
            }}
          >
            <Text style={[styles.segmentLabel, mode === 'signup' && styles.segmentLabelActive]}>
              Kayıt
            </Text>
          </Pressable>
        </View>

        {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="ornek@eposta.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!submitting}
        />

        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          editable={!submitting}
        />

        {mode === 'signup' ? (
          <>
            <Text style={styles.label}>Görünen ad (isteğe bağlı)</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Profilde kullanılacak isim"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!submitting}
            />
          </>
        ) : null}

        <Pressable
          style={[styles.primaryBtn, submitting && styles.btnDisabled]}
          onPress={mode === 'signin' ? handleSignIn : handleSignUp}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'signin' ? 'Giriş yap' : 'Kayıt ol'}
            </Text>
          )}
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeLogged: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loggedScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSpaced: {
    marginTop: 16,
  },
  secondaryBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  settingsErr: {
    marginTop: 12,
    fontSize: 14,
    color: colors.primary,
  },
  settingsOk: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  welcome: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emailMuted: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  segment: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentLabel: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  formError: {
    color: colors.primary,
    marginBottom: 8,
    fontSize: 14,
  },
  info: {
    color: colors.textMuted,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});
