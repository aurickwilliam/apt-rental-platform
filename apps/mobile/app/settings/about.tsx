import {
  View,
  Text,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Image } from "expo-image";

import { 
  Github, 
  Globe, 
  Mail, 
  Facebook, 
  Instagram 
} from "lucide-react-native";

import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

import { useColors } from "@/hooks/useTheme";

import { Separator } from "heroui-native";

const APP_VERSION = "1.0.0";

const developers = [
  { id: 1, name: "Aurick William E. Lorenzo", role: "Full Stack Developer" },
  { id: 2, name: "Bryl Lim", role: "UI/UX Designer" },
  { id: 3, name: "Bill Gates", role: "Backend Developer" },
  { id: 4, name: "Linus Torvalds", role: "Mobile Developer" },
];

const socials = [
  {
    id: 1,
    label: "Website",
    icon: Globe,
    url: "https://apt.com",
  },
  {
    id: 2,
    label: "Facebook",
    icon: Facebook,
    url: "https://facebook.com/apt",
  },
  {
    id: 3,
    label: "Instagram",
    icon: Instagram,
    url: "https://instagram.com/apt",
  },
  {
    id: 4,
    label: "Email",
    icon: Mail,
    url: "mailto:support@apt.com",
  },
  {
    id: 5,
    label: "GitHub",
    icon: Github,
    url: "https://github.com/apt",
  },
];

export default function AboutScreen() {
  const { colors } = useColors();

  const handleLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="About Us" />}
      scrollable
      className="px-5"
    >
     {/* App Info */}
      <View className="items-center pt-8 pb-6">
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 80, height: 80, borderRadius: 20 }}
          contentFit="contain"
        />
        <Text className="mt-4 text-2xl font-bold text-foreground">APT</Text>
        <Text className="text-muted text-sm mt-1">
          A Place to Thrive
        </Text>
        <View className="mt-3 px-3 py-1 rounded-full bg-primary/10">
          <Text className="text-accent text-xs font-medium">
            Version {APP_VERSION}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <Separator className="my-6" />

      {/* Description */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-foreground mb-2">
          About the App
        </Text>
        <Text className="text-sm text-muted leading-6">
          APT is a property rental platform designed for the Philippine
          market, primarily targeting Metro Manila. It connects tenants and
          landlords, making the rental process seamless — from searching for a
          place to managing leases and payments, all in one app.
        </Text>
      </View>

      {/* Divider */}
      <Separator className="my-6" />

      {/* Meet the Team */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-foreground mb-3">
          Meet the Team
        </Text>
        <View className="gap-3">
          {developers.map((dev) => (
            <View
              key={dev.id}
              className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3"
            >
              <View className="w-9 h-9 rounded-full bg-surface-tertiary items-center justify-center">
                <Text className="text-accent font-semibold text-sm">
                  {dev.name.charAt(0)}
                </Text>
              </View>
              <View>
                <Text className="text-sm font-medium text-foreground">
                  {dev.name}
                </Text>
                <Text className="text-xs text-muted">{dev.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <Separator className="my-6" />

      {/* Social Links */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-foreground mb-3">
          Connect with Us
        </Text>
        <View className="gap-2">
          {socials.map((social) => {
            const Icon = social.icon;
            return (
              <TouchableOpacity
                key={social.id}
                onPress={() => handleLink(social.url)}
                className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3 active:opacity-70"
              >
                <Icon size={18} color={colors.primary} />
                <Text className="text-sm text-foreground">
                  {social.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Divider */}
      <Separator className="my-6" />

      {/* STI Branding */}
      <View className="items-center">
        <Text className="text-xs text-muted text-center leading-5">
          Developed as a capstone project at
        </Text>
        <Text className="text-xs font-semibold text-muted text-center">
          STI College Caloocan
        </Text>
        <Text className="text-xs text-muted text-center mt-1">
          © {new Date().getFullYear()} APT. All rights reserved.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
