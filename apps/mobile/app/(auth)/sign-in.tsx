import {View, Text} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Image} from "expo-image";

import { images } from '@/constants/images';

export default function SignIn() {
    return (
        <View className="bg-white h-full pt-5 px-5">
            {/* Logo at the top */}
            <SafeAreaView className='mx-auto'>
                <View className='w-32 h-32'>
                    <Image 
                        source={images.logo} 
                        style={{width: '100%', height: '100%'}}
                    />
                </View>
            </SafeAreaView>

            {/* Title at the top */}
            <View className='flex gap-2'>
                <Text className='text-4xl font-dmserif'>
                    Create Your Account
                </Text>
                <Text className='text-md font-poppins'>
                    Join as tenant to start renting.
                </Text>
            </View>
        </View>
    )
}
