import { View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';

import ScreenWrapper from '@/components/ScreenWrapper'

import { COLORS } from '@/constants/colors';
import TextField from '@/components/TextField';
import PillButton from '@/components/PillButton';

export default function CompleteProfile() {
  const router = useRouter();

  const { email, userSide } = useLocalSearchParams();

  // Handle case where email might be an array
  const emailValue = Array.isArray(email) ? email[0] : email;

  return (
    <ScreenWrapper hasInput scrollable className="px-5 pt-5">
      
      {/* Back button */}
      <Pressable className="mb-3" onPress={router.back}>
        <Ionicons name="close" size={30} color={COLORS.text} />
      </Pressable>

      {/* Title */}
      <Text className="text-2xl text-text font-poppinsSemiBold mb-5">
        Complete Your {userSide === 'landlord' ? "Landlord " : "Tenant"} Profile
      </Text>

      {/* Form Inputs */}

      <View className="flex gap-4">
        {/* Email Address Field */}
        <TextField 
          label="Email Address:"
          value={emailValue}
          disabled
        />

        {/* First Name Field */}
        <TextField 
          label="First Name:"
          placeholder="Enter your first name"
          required
        />

        {/* Last Name Field */}
        <TextField 
          label="Last Name:"
          placeholder="Enter your last name"
          required
        />

        {/* Middle Name Field */}
        <TextField 
          label="Middle Name:"
          placeholder="Enter your middle name"
        />

        {/* Current Address Field */}
        <TextField 
          label="Current Address:"
          placeholder="Enter your current address"
          required
        />

        {/* Barangay Field */}
        <TextField 
          label="Barangay:"
          placeholder="Enter your barangay"
          required
        />

        {/* City Field  */}
        <TextField 
          label="City:"
          placeholder="Enter your city"
          required
        />

        {/* Province Field */}
        {/* TODO: Dropdown Field*/}

        {/* Postal Code Field */}
        {/* TODO: Number Field */}

        {/* Date of Birth Field */}
        {/* TODO: Date Picker Field */}

        {/* Password Field */}
        <TextField 
          label="Password:"
          placeholder="Create a password"
          isPassword
          required
        />

        {/* Confirm Password Field */}
        <TextField 
          label="Confirm Password:"
          placeholder="Confirm your password"
          isPassword
          required
        />
      </View>

      {/* Submit Button */}
      <View className="mt-16 mb-5">
        <PillButton 
          label="Submit"
          isFullWidth
          onPress={() => console.log("Complete Profile Submitted")}
        />
      </View>

    </ScreenWrapper>
  )
}