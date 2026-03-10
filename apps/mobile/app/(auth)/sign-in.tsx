import { View, Text, Image, Platform, Pressable } from 'react-native';
import { useState } from "react";
import { Link, useRouter } from 'expo-router';

import { IMAGES } from '../../constants/images';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import TextField from 'components/inputs/TextField';
import PillButton from 'components/buttons/PillButton';
import LogoButton from 'components/buttons/LogoButton';

import { supabase } from '@repo/supabase';

export default function SignIn() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userSide, setUserSide] = useState<'tenant' | 'landlord'>('tenant');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const router = useRouter();

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
    if (error) setError('');
  };

  const handlePasswordTextChange = (text: string) => {
    setPassword(text);
    if (error) setError('');
  };

  const toggleUserSide = () => setUserSide(prev => prev === 'tenant' ? 'landlord' : 'tenant');

  const handleSignIn = async () => {
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Map common Supabase auth errors to user-friendly messages
        if (signInError.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please try again.');
        } else if (signInError.message === 'Email not confirmed') {
          setError('Please verify your email address before signing in.');
        } else if (signInError.message.includes('rate limit')) {
          setError('Too many sign-in attempts. Please try again later.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Successfully signed in — navigate based on user role
      router.replace(
        userSide === 'tenant'
          ? '../(tabs)/(tenant)/home'
          : '../(tabs)/(landlord)/dashboard'
      );
    } catch (err) {
      setError('An unexpected error occurred. Please check your connection and try again.');
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper className='p-5'>
      {/* Logo at the top */}
      <View className="w-32 h-32 mx-auto">
        <Image
          source={IMAGES.logo}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className="text-4xl text-text font-dmserif">
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

      {/* Error message */}
      {error ? (
        <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-sm text-red-600 font-inter">{error}</Text>
        </View>
      ) : null}

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

      <Link href="/forgot-password" asChild>
        <Text className="mt-3 self-start text-left text-secondary font-interMedium underline">
          Forgot Password?
        </Text>
      </Link>

      {/* Sign In Button */}
      <View className="mt-5">
        <PillButton
          label={loading ? "Signing In..." : "Sign In"}
          isFullWidth={true}
          onPress={handleSignIn}
          isDisabled={loading}
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
        <LogoButton image={IMAGES.googleLogo} />
        <LogoButton image={IMAGES.facebookLogo} />

        {/* Show Apple sign in when using iOS */}
        {Platform.OS === 'ios' && (
          <LogoButton image={IMAGES.appleLogo} />
        )}
      </View>

      {/* Footer links - Push to bottom with flex-1 spacer */}
      <View className="flex-1" />

      <View className="mb-8 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            New here?
          </Text>
          <Link
            href="/sign-up"
            className="text-primary font-interMedium underline"
            replace={true}
          >
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
      </View>
    </ScreenWrapper>
  );
}
