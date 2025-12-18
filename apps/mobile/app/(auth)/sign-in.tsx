import {View, Text, Image, Platform, Pressable} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from "react";
import { Link } from 'expo-router';

import { IMAGES } from '@/constants/images'

import TextField from "@/components/TextField";
import PillButton from "@/components/PillButton";
import LogoButton from "@/components/LogoButton";

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userSide, setUserSide] = useState('tenant'); // tenant | landlord

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
  }

  const handlePasswordTextChange = (text: string) => {
    setPassword(text);
  }

  const toggleUserSide = () => {
    if (userSide === 'tenant') {
      setUserSide('landlord');
    }
    else {
      setUserSide('tenant');
    }
  }

  const handleSignIn = () => {
    // TODO: Implement sign-in logic here
    console.log("Sign In pressed:");
    console.log(email, password);
  }

  return (
    <View className='bg-white h-full pt-5 px-5 flex-1'>
      
      {/* Logo at the top */}
      <SafeAreaView className="mx-auto">
        <View className="w-32 h-32">
          <Image
            source={IMAGES.logo}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      </SafeAreaView>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className={`text-4xl text-text font-dmserif`}>
          Welcome Back!
        </Text>
        <Text className="text-md text-text font-poppins">
          {
            userSide === 'tenant' ? 
            'Log in to continue your apartment journey.' : 
            'Access your listings and manage your tenants easily.'
          }
        </Text>
      </View>

      {/* Form inputs */}
      <View className="mt-8 flex gap-4">
        <TextField 
          label="Email Address:"
          placeholder="Enter your email"
          value={email}
          onChangeText={handleEmailTextChange}
          error=""
          required={true}
        />

        <TextField 
          label="Password:"
          placeholder="Enter your password"
          value={password}
          onChangeText={handlePasswordTextChange}
          error=""
          isPassword={true}
          required={true}
        />
      </View>

      <Link href={'/'} className='mt-3'>
        <Text className="text-left text-secondary font-interMedium underline">
          Forgot Password?
        </Text>
      </Link>

      {/* Sign In Button */}
      <View className="mt-5">
        <PillButton 
          label="Sign In"
          onPress={() => handleSignIn()}
        />
      </View>

      {/* Divider */}
      <View className="flex-row justify-center items-center mt-7 mb-7">
        <View className="flex-1 h-[2px] bg-grey-300 rounded-full mt-1" />
        
        <Text className="mx-3 text-grey-400 font-inter">
          or sign in with
        </Text>
        
        <View className="flex-1 h-[2px] bg-grey-300 rounded-full mt-1" />
      </View>

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-10">
        <LogoButton 
          image={IMAGES.googleLogo}
        />
        <LogoButton 
          image={IMAGES.facebookLogo}
        />

        {/* Show Apple sign in when using iOS */}
        {
          Platform.OS === 'ios' && 
          <LogoButton 
            image={IMAGES.appleLogo}
          />
        }
      </View>

      {/* Footer links */}
      <SafeAreaView className="mt-auto mb-8 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            New here?
          </Text>
          <Link href={"/sign-in"} className="text-primary font-interMedium underline">
            Sign Up
          </Link>
        </View>

        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            {
              userSide === 'tenant' ?
              'Want to list your apartment?' :
              'Here to find a place?'
            }
            
          </Text>
          <Pressable onPress={toggleUserSide}>
            <Text className="text-primary font-interMedium underline">
              {
                userSide === 'tenant' ?
                'Register as Landlord' :
                'Continue as Tenant'
              }
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  )
}
