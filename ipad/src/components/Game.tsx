import React, { useEffect, useRef, useState } from 'react';
import { Image, AppState, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { WebView } from 'react-native-webview';
import { isAllowedWebUrl } from '../connection';
import { webCheckpointScript } from '../web-checkpoint';
import { styles } from '../styles';
function KeepScreenAwake() { useKeepAwake(); return null; }

export default function Game({ url }: { url: string; close?: () => void }) {
  const [activePlay, setActivePlay] = useState(false);
  const web = useRef<WebView<object>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') web.current?.injectJavaScript('window.dispatchEvent(new Event("focus")); true;');
    });
    return () => subscription.remove();
  }, []);
  return <View style={styles.game}>
    <StatusBar hidden />
    {activePlay && <KeepScreenAwake />}
    <WebView<object> ref={web} key={reloadKey} source={{ uri: `${url}?surface=ipad` }} style={styles.web}
      originWhitelist={['*']}
      javaScriptEnabled domStorageEnabled sharedCookiesEnabled
      allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false}
      scrollEnabled bounces={false} allowsBackForwardNavigationGestures={false}
      contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
      setSupportMultipleWindows={false}
      onLoadStart={() => { setLoading(true); setError(''); setActivePlay(false); }}
      onLoadEnd={() => setLoading(false)}
      onError={event => { setActivePlay(false); setLoading(false); setError(event.nativeEvent.description); }}
      onHttpError={event => { if (event.nativeEvent.statusCode >= 400) { setActivePlay(false); setLoading(false); setError(`The game returned ${event.nativeEvent.statusCode}.`); } }}
      onContentProcessDidTerminate={() => { setActivePlay(false); setReloadKey(value => value + 1); }}
      injectedJavaScript={webCheckpointScript(new URL(url).origin)}
      onMessage={event => {
        try {
          if (new URL(event.nativeEvent.url).origin !== new URL(url).origin) return;
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'play-state' && typeof message.playing === 'boolean') setActivePlay(message.playing);
        } catch {}
      }}
      onShouldStartLoadWithRequest={request => isAllowedWebUrl(request.url)} />
    {loading && !error && <View pointerEvents="none" style={[styles.loading, { backgroundColor: '#19150f' }]}><Image source={require('../../assets/icon.png')} resizeMode="contain" style={{ width: 320, height: 320, maxWidth: '80%', maxHeight: '80%' }} accessibilityLabel="Podrick’s Violin" /><Text style={{ color: '#e3d4b7' }}>Opening…</Text></View>}
    {!!error && <View style={styles.error}><Text style={styles.heading}>Couldn’t reach the game</Text><Text style={styles.detail}>{error}</Text><Text style={styles.detail}>For local play, keep your computer running and connect both devices to the same Wi-Fi.</Text><Pressable style={styles.primary} onPress={() => { setError(''); setReloadKey(value => value + 1); }}><Text style={styles.primaryText}>Try again</Text></Pressable></View>}
  </View>;
}
