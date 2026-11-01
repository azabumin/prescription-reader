// Picking a prescription photo and shrinking it for upload. Shared by the patient's send screen (app/send.tsx) and the
// pharmacy's walk-in check (app/pharmacy/check.tsx).
import { Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { longEdgeResize } from './sendLogic';

export const MAX_IMAGE_B64 = 1_500_000; // keep in sync with worker/src/intake/types.ts

export type PreparedPhoto = { uri: string; base64: string };

// On web the picker may report 0 x 0 (expo-image-picker docs); measure the image so a large scan still gets shrunk.
function measure(uri: string, width: number, height: number): Promise<{ width: number; height: number }> {
  if (width > 0 && height > 0) return Promise.resolve({ width, height });
  return new Promise((resolve) =>
    Image.getSize(
      uri,
      (w, h) => resolve({ width: w, height: h }),
      () => resolve({ width: 0, height: 0 }),
    ),
  );
}

async function toJpegBase64(uri: string, width: number, height: number, compress: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  const size = longEdgeResize(width, height);
  if (size) ctx.resize(size);
  const rendered = await ctx.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
  if (!result.base64) throw new Error('no base64 output');
  return result.base64;
}

// null = cancelled. 'denied' = no permission (native only), 'too_large' = still over the upload limit after
// recompressing. Throws when the picker or the conversion fails. Call it straight from a button press (web).
export async function pickPhoto(source: 'camera' | 'library'): Promise<PreparedPhoto | null | 'denied' | 'too_large'> {
  // web: asking for camera permission first breaks the browser's user-activation chain (see app/index.tsx)
  if (Platform.OS !== 'web' || source === 'library') {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return 'denied';
  }
  const picked =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (picked.canceled || !picked.assets?.length) return null;
  const a = picked.assets[0];
  const { width, height } = await measure(a.uri, a.width, a.height);
  let base64 = await toJpegBase64(a.uri, width, height, 0.85);
  if (base64.length > MAX_IMAGE_B64) base64 = await toJpegBase64(a.uri, width, height, 0.6);
  if (base64.length > MAX_IMAGE_B64) return 'too_large';
  return { uri: a.uri, base64 };
}
