import { View } from 'react-native';
import { Button } from 'heroui-native';
import { GiphyDialog, GiphySDK } from '@giphy/react-native-sdk';

GiphySDK.configure({
  apiKey: process.env.EXPO_PUBLIC_GIPHY_API_KEY!,
});

export default function GiphyTestScreen() {
  const openPicker = () => {
    GiphyDialog.show();
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Button onPress={openPicker}>
        Open GIF Picker
      </Button>
    </View>
  );
}
