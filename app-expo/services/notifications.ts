// T5 E5: Push + daily drill — expo-notifications + FCM
import * as Notifications from 'expo-notifications';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }) });
export async function registerPush() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
export async function scheduleDailyDrill() {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'PRISM Drill', body: 'Your Infosys readiness dropped 5% — 2 min drill?' },
    trigger: { seconds: 86400, repeats: true } as any,
  });
}
