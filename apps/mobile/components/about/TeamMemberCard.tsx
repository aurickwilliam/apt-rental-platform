import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react-native";

import type { TeamMember } from "@repo/constants";

import { useColors } from "@/hooks/useTheme";

interface TeamMemberCardProps {
  member: TeamMember;
  photo: number;
  onOpenLink: (url: string) => void;
}

export default function TeamMemberCard({ member, photo, onOpenLink }: TeamMemberCardProps) {
  const { colors } = useColors();

  const links = [
    { key: "github", label: `${member.name} on GitHub`, url: member.github, Icon: IconBrandGithub },
    { key: "linkedin", label: `${member.name} on LinkedIn`, url: member.linkedin, Icon: IconBrandLinkedin },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      <View className="flex-row items-center gap-3">
        <Image
          source={photo}
          accessibilityLabel={`Photo of ${member.name}`}
          style={{ width: 64, height: 64, borderRadius: 16 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="text-base font-nunitoBold text-foreground">{member.name}</Text>
          <Text className="text-xs font-nunitoSemiBold text-accent mt-0.5">{member.role}</Text>
        </View>
      </View>

      <Text className="text-sm text-muted leading-5 mt-3">{member.bio}</Text>

      {links.length > 0 ? (
        <View className="flex-row gap-2 mt-3">
          {links.map(({ key, label, url, Icon }) => (
            <Pressable
              key={key}
              accessibilityRole="link"
              accessibilityLabel={label}
              onPress={() => onOpenLink(url)}
              hitSlop={4}
              className="w-11 h-11 rounded-xl bg-surface-tertiary items-center justify-center active:opacity-70"
            >
              <Icon size={20} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
