import { DarkTheme, ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import '@/lib/reanimatedLogger';
import "../global.css";
import { useAppStore } from '@/lib/store';
import { initDatabase } from '@/lib/db';
import { PlayerProvider } from '@/lib/PlayerContext';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { MagicKidsLoader } from '@/components/tv/MagicKidsLoader';
import { enableScreens } from 'react-native-screens';

export {
  ErrorBoundary,
} from 'expo-router';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Ensure native screen primitives are used for better TV performance.
enableScreens(true);

const STARTUP_TIMEOUT_MS = 4000;

function withStartupTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function setup() {
      try {
        await withStartupTimeout(initDatabase(), STARTUP_TIMEOUT_MS);
      } catch (e) {
        console.error('Database init failed:', e);
      } finally {
        setDbReady(true);
      }
    }
    setup();
  }, []);

  useEffect(() => {
    if (error) {
      console.error('Font loading failed:', error);
    }
  }, [error]);

  const appReady = (loaded || Boolean(error)) && dbReady;

  useEffect(() => {
    if (appReady) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [appReady]);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { currentProfile, isGlobalLoading } = useAppStore();

  return (
    <ThemeProvider value={currentProfile?.mode === 'kids' ? DefaultTheme : DarkTheme}>
      <PlayerProvider>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'simple_push', // Very smooth native feel
            freezeOnBlur: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="kids-home" />
          <Stack.Screen name="kids-player" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="shorts-player" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="live-guide" />
          <Stack.Screen name="channel/[id]" />
        </Stack>
        
        {isGlobalLoading && (
          <View style={StyleSheet.absoluteFill} className="z-[999] items-center justify-center bg-black/60">
            {currentProfile?.mode === 'kids' ? <MagicKidsLoader /> : <SingularityLoader />}
          </View>
        )}
      </PlayerProvider>
    </ThemeProvider>
  );
}
