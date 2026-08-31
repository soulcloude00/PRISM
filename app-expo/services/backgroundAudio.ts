// T4 E3: Background TTS — foreground service + lock-screen controls
import { Audio } from 'expo-av';
export async function playBackground(uri: string) {
  await Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, staysActiveInBackground: true });
  return sound;
}
