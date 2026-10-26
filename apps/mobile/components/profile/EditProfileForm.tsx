import { useEffect, useRef, useState, type ReactNode } from "react";
import { Keyboard, Text, View } from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove, type NavigationAction } from "expo-router/react-navigation";
import { Avatar, Button, FieldError, Input, Label, Spinner, TextField } from "heroui-native";
import { IconCamera, IconId, IconLock, IconMapPin, IconPhone } from "@tabler/icons-react-native";
import { GENDERS, PROVINCES, getBarangaysByCity, getCitiesByProvince, type Province } from "@repo/constants";
import { formatDate } from "@repo/utils";

import ScreenWrapper, { type ScreenWrapperScrollRef } from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DropdownField from "@/components/inputs/DropdownField";
import ConfirmDialog from "@/components/display/ConfirmDialog";
import ErrorDialog from "@/components/display/ErrorDialog";
import SuccessDialog from "@/components/display/SuccessDialog";
import { useEditProfile } from "@/hooks/auth/useEditProfile";
import { useColors } from "@/hooks/useTheme";
import { usePortalStore } from "@/stores/usePortalStore";
import { choosePortal } from "@/service/auth/portalPreference";
import type { UserProfile } from "@/service/auth/currentUserService";
import type { ProfileField } from "@/service/auth/profileService";

interface EditProfileFormProps {
  profile: UserProfile;
}

function LockedField({ label, value }: { label: string; value: string | null }) {
  const { colors } = useColors();
  return (
    <TextField>
      <Label className="flex-row items-center gap-1.5">
        <Label.Text>{label}</Label.Text>
        <IconLock size={14} color={colors.textSecondary} />
      </Label>
      <Input
        accessibilityLabel={`${label} (read-only)`}
        value={value || "—"}
        editable={false}
        className="bg-surface-tertiary text-muted"
      />
    </TextField>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <View className="gap-5 rounded-3xl border border-border bg-surface p-5">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text accessibilityRole="header" className="text-accent text-lg font-nunitoSemiBold">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function EditProfileForm({ profile }: EditProfileFormProps) {
  const { colors } = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const activePortal = usePortalStore((state) => state.portal);
  const edit = useEditProfile(profile);
  const scrollRef = useRef<ScreenWrapperScrollRef>(null);
  const fieldNodes = useRef<Partial<Record<ProfileField, View | null>>>({});
  const contentRef = useRef<View>(null);
  const exitAction = useRef<NavigationAction | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);

  const returnToProfile = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      const portal = choosePortal(profile.roles, activePortal);
      router.replace(!portal ? "/" : portal === "landlord" ? "/(tabs)/(landlord)/profile" : "/(tabs)/(tenant)/profile");
    }
  };

  usePreventRemove(!allowLeave && !edit.succeeded && (edit.dirty || edit.busy), ({ data }) => {
    if (edit.busyRef.current) return;
    Keyboard.dismiss();
    exitAction.current = data.action;
    setDiscardOpen(true);
  });

  // Dispatch only after the prevention hook has observed allowLeave=false→true.
  useEffect(() => {
    if (!allowLeave || !exitAction.current) return;
    const action = exitAction.current;
    exitAction.current = null;
    navigation.dispatch(action);
  }, [allowLeave, navigation]);

  const handleSave = async () => {
    Keyboard.dismiss();
    const firstError = await edit.save();
    const node = firstError ? fieldNodes.current[firstError] : null;
    if (node && contentRef.current) {
      node.measureLayout(contentRef.current, (_x, y) => {
        scrollRef.current?.scrollTo({ x: 0, y: Math.max(y - 16, 0), animated: true });
      }, () => {});
    }
  };

  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Your profile";
  const avatarUri = edit.photos.avatar?.uri ?? profile.avatar_url;
  const backgroundUri = edit.photos.background?.uri ?? profile.background_url;
  const disabled = edit.busy || edit.succeeded;
  const saveDisabled = disabled || !edit.dirty;
  const cities = edit.fields.province ? getCitiesByProvince(edit.fields.province as Province) : [];
  const barangays = edit.fields.city ? getBarangaysByCity(edit.fields.city) : [];
  const requestExit = () => {
    if (!edit.busyRef.current) returnToProfile();
  };

  return (
    <ScreenWrapper
      scrollable
      ref={scrollRef}
      header={<StandardHeader title="Edit Profile" onBackPress={requestExit} />}
      className="p-5"
    >
      <View ref={contentRef} collapsable={false} className="gap-5">
        <View className="rounded-3xl border border-border bg-surface">
          <View className="h-40 overflow-hidden rounded-t-3xl bg-surface-tertiary">
            {backgroundUri ? (
              <Image source={{ uri: backgroundUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" accessibilityLabel="Background photo preview" />
            ) : null}
            <Button
              isIconOnly size="sm" variant="secondary"
              accessibilityLabel="Change background photo"
              onPress={() => void edit.pickPhoto("background")}
              isDisabled={disabled}
              className="absolute top-3 right-3 border-2 border-background"
            >
              {edit.picking === "background" ? <Spinner size="sm" /> : <IconCamera size={20} color={colors.primaryLightForeground} />}
            </Button>
          </View>
          <View className="-mt-12 mb-5 self-center">
            <Avatar size="lg" className="size-32 rounded-full border-4 border-surface" alt={displayName}>
              {avatarUri ? <Avatar.Image source={{ uri: avatarUri }} /> : null}
              <Avatar.Fallback className="items-center justify-center bg-primary-light">
                <Text className="text-accent text-4xl font-nunitoBold">{initials}</Text>
              </Avatar.Fallback>
            </Avatar>
            <Button
              isIconOnly size="sm" variant="secondary"
              accessibilityLabel="Change profile photo"
              onPress={() => void edit.pickPhoto("avatar")}
              isDisabled={disabled}
              className="absolute bottom-0 right-0 border-2 border-surface"
            >
              {edit.picking === "avatar" ? <Spinner size="sm" /> : <IconCamera size={20} color={colors.primaryLightForeground} />}
            </Button>
          </View>
          <Text className="px-5 pb-5 text-center text-muted text-xs font-inter">Photo changes are saved when you tap Save Changes.</Text>
        </View>

        <FormSection title="Personal Information" icon={<IconId size={24} color={colors.primary} />}>
          <LockedField label="Email" value={profile.email} />
          <LockedField label="First Name" value={profile.first_name} />
          <LockedField label="Middle Name" value={profile.middle_name} />
          <LockedField label="Last Name" value={profile.last_name} />
          <LockedField label="Suffix" value={profile.suffix} />
          <LockedField label="Birth Date" value={profile.birth_date ? formatDate(`${profile.birth_date.slice(0, 10)}T00:00:00`, "long") : null} />
          <Text className="text-muted text-xs font-inter">Names and birth date are locked. Contact support if they need correction.</Text>
        </FormSection>

        <FormSection title="Contact" icon={<IconPhone size={24} color={colors.primary} />}>
          <View ref={(node) => { fieldNodes.current.mobile_number = node; }} collapsable={false}>
            <TextField isRequired isInvalid={!!edit.errors.mobile_number} isDisabled={disabled}>
              <Label>Mobile Number</Label>
              <Input
                accessibilityLabel="Mobile Number"
                value={edit.fields.mobile_number}
                onChangeText={edit.changeMobile}
                onBlur={() => edit.blurField("mobile_number")}
                keyboardType="phone-pad"
                placeholder="09XX XXX XXXX or +63 9XX XXX XXXX"
                editable={!disabled}
              />
              <FieldError>{edit.errors.mobile_number}</FieldError>
            </TextField>
          </View>
          <View ref={(node) => { fieldNodes.current.gender = node; }} collapsable={false}>
            <DropdownField
              label="Gender" bottomSheetLabel="Select Gender" placeholder="Select Gender"
              options={GENDERS} required disabled={disabled}
              value={edit.fields.gender} onSelect={(value) => edit.updateField("gender", value ?? "")}
              error={edit.errors.gender}
            />
          </View>
        </FormSection>

        <FormSection title="Address" icon={<IconMapPin size={24} color={colors.primary} />}>
          <View ref={(node) => { fieldNodes.current.street_address = node; }} collapsable={false}>
            <TextField isRequired isInvalid={!!edit.errors.street_address} isDisabled={disabled}>
              <Label>Street Address</Label>
              <Input
                accessibilityLabel="Street Address" placeholder="Enter your street address"
                value={edit.fields.street_address}
                onChangeText={(value) => edit.updateField("street_address", value)}
                onBlur={() => edit.blurField("street_address")}
                editable={!disabled}
              />
              <FieldError>{edit.errors.street_address}</FieldError>
            </TextField>
          </View>
          <View ref={(node) => { fieldNodes.current.province = node; }} collapsable={false}>
            <DropdownField
              label="Province" bottomSheetLabel="Select Province" placeholder="Select Province"
              options={PROVINCES} required enableSearch searchPlaceholder="Search for Province..." disabled={disabled}
              value={edit.fields.province} onSelect={(value) => edit.updateField("province", value ?? "")}
              error={edit.errors.province}
            />
          </View>
          <View ref={(node) => { fieldNodes.current.city = node; }} collapsable={false}>
            <DropdownField
              label="City" bottomSheetLabel="Select City" placeholder="Select City"
              options={cities} required enableSearch searchPlaceholder="Search for City..."
              disabled={disabled || !edit.fields.province}
              value={edit.fields.city} onSelect={(value) => edit.updateField("city", value ?? "")}
              error={edit.errors.city}
            />
          </View>
          <View ref={(node) => { fieldNodes.current.barangay = node; }} collapsable={false}>
            <DropdownField
              label="Barangay" bottomSheetLabel="Select Barangay" placeholder="Select Barangay"
              options={barangays} required enableSearch searchPlaceholder="Search for Barangay..."
              disabled={disabled || !edit.fields.city}
              value={edit.fields.barangay} onSelect={(value) => edit.updateField("barangay", value ?? "")}
              error={edit.errors.barangay}
            />
          </View>
          <View ref={(node) => { fieldNodes.current.postal_code = node; }} collapsable={false}>
            <TextField isRequired isInvalid={!!edit.errors.postal_code} isDisabled={disabled}>
              <Label>Postal Code</Label>
              <Input
                accessibilityLabel="Postal Code" placeholder="Enter your postal code"
                value={edit.fields.postal_code} onChangeText={edit.changePostal}
                onBlur={() => edit.blurField("postal_code")}
                keyboardType="number-pad" maxLength={4} editable={!disabled}
              />
              <FieldError>{edit.errors.postal_code}</FieldError>
            </TextField>
          </View>
        </FormSection>

        <View className="flex-row gap-3 pb-5">
          <Button variant="danger-soft" onPress={requestExit} isDisabled={disabled} className="flex-1"><Button.Label>Cancel</Button.Label></Button>
          <Button
            onPress={() => void handleSave()}
            isDisabled={saveDisabled}
            className={saveDisabled ? "flex-1 opacity-50" : "flex-1"}
          >
            {edit.saving ? <Spinner size="sm" color={colors.secondaryForeground} /> : null}
            <Button.Label>{edit.saving ? "Saving..." : "Save Changes"}</Button.Label>
          </Button>
        </View>
      </View>

      <ConfirmDialog
        isOpen={discardOpen}
        onOpenChange={(open) => {
          setDiscardOpen(open);
          if (!open) exitAction.current = null;
        }}
        title="Discard changes?"
        description="Your unsaved changes will be lost if you leave now."
        cancelLabel="Keep Editing" confirmLabel="Discard"
        onConfirm={() => { setDiscardOpen(false); setAllowLeave(true); }}
      />
      <ErrorDialog isOpen={!!edit.errorMessage} onClose={() => edit.setErrorMessage(null)} message={edit.errorMessage} />
      <SuccessDialog
        isOpen={edit.succeeded} title="Profile Updated"
        message="Your profile has been updated successfully."
        onClose={returnToProfile}
      />
    </ScreenWrapper>
  );
}
