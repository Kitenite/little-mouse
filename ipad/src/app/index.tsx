import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useRouter } from 'expo-router';
import { DEFAULT_GAME, HOSTED_GAME, companionUrl, normalizeGameUrl } from '../connection';
import { styles } from '../styles';
const CONNECTION_KEY = 'little-mouse-game-url';
export default function Home() {
  const [draft, setDraft] = useState(DEFAULT_GAME);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const [updateBusy, setUpdateBusy] = useState(false);
  useEffect(() => { let live = true; AsyncStorage.getItem(CONNECTION_KEY).then(saved => {
    if (live && saved) { try { const normalized = normalizeGameUrl(saved); setDraft(normalized); } catch {} }
  }).catch(() => {}).finally(() => { if (live) setReady(true); }); return () => { live = false; }; }, []);
  function play() {
    try {
      const normalized = normalizeGameUrl(draft);
      // Opening the game must not wait for storage during reload/recovery.
      void AsyncStorage.setItem(CONNECTION_KEY, normalized).catch(() => {});
      setDraft(normalized); router.push({ pathname: '/game', params: { url: normalized } });
    } catch (error) { Alert.alert('Check the game address', error instanceof Error ? error.message : 'Could not open the game.'); }
  }
  async function updateApp() {
    if (__DEV__ || !Updates.isEnabled) { Alert.alert('Development mode', 'App changes arrive through the development server. Hosted game updates arrive automatically.'); return; }
    setUpdateBusy(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) { await Updates.fetchUpdateAsync(); await Updates.reloadAsync(); }
      else Alert.alert('You’re up to date', 'The latest app update is installed. Game updates are checked automatically during play.');
    } catch { Alert.alert('Couldn’t check for updates', 'Check your connection and try again.'); }
    finally { setUpdateBusy(false); }
  }
  if (!ready) return <View style={styles.center}><ActivityIndicator color="#304d38" /></View>;
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.eyebrow}>A LITTLE WORLD TO CHASE</Text>
        <Text style={styles.title}>Podrick’s Violin</Text>
        <Text style={styles.subtitle}>Your cat’s game, on iPad.</Text>
        <Text style={styles.detail}>Real-time mice, familiar controls, and a companion on your phone or laptop.</Text>
        <Pressable accessibilityRole="button" style={styles.primary} onPress={play}><Text style={styles.primaryText}>Let’s play ↗</Text></Pressable>
        <Text style={styles.label}>Game address</Text>
        <TextInput accessibilityLabel="Game address" style={styles.input} value={draft} onChangeText={setDraft} autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" onSubmitEditing={play} />
        <Pressable onPress={() => setDraft(HOSTED_GAME)}><Text style={styles.link}>Use the hosted game</Text></Pressable>
        <Text style={styles.note}>The hosted game is private and may ask you to sign in. For local play, enter your computer’s address on the same Wi-Fi.</Text>
        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={async () => { try { const link = companionUrl(draft); await Share.share({ message: link, url: link }); } catch { Alert.alert('Check the game address', 'Enter a valid game address first.'); } }}><Text style={styles.secondaryText}>Share companion</Text></Pressable>
          <Pressable style={styles.secondary} disabled={updateBusy} onPress={updateApp}><Text style={styles.secondaryText}>{updateBusy ? 'Checking…' : 'Update app'}</Text></Pressable>
        </View>
        <Text style={styles.note}>Use the pairing code inside the game to connect your companion. During play, pause from the companion or tap the four screen corners clockwise, starting at the top left. App connection settings appear when play is paused.</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
