import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system/legacy";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import Divider from "components/display/Divider";
import PerkItem from "components/display/PerkItem";

import { Button } from "heroui-native";

import {
  FileText,
  SquarePen,
  Upload,
  House,
  BedDouble,
  Bath,
  Maximize,
  Armchair,
  Calendar,
  Users,
  Building,
} from 'lucide-react-native';

import { supabase } from "@repo/supabase";

import { useColors } from "hooks/useTheme";

type Apartment = {
  id: string;
  name: string;
  description: string;
  monthly_rent: number;
  security_deposit: number;
  advance_rent: number;
  type: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  furnished_type: string | null;
  floor_level: string | null;
  max_occupants: number | null;
  lease_duration: string | null;
  amenities: string[];
  lease_agreement_url: string | null;
  landlord: {
    first_name: string;
    last_name: string;
  } | null;
};

type ActiveTenancy = {
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  tenant: {
    first_name: string;
    last_name: string;
  } | null;
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "—";
  return `₱ ${Number(amount).toLocaleString("en-PH")}`;
}

export default function Index() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { colors } = useColors();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [tenancy, setTenancy] = useState<ActiveTenancy | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!apartmentId) return;
    setLoading(true);

    const { data: aptData, error: aptError } = await supabase
      .from("apartments")
      .select(
        `
        id, name, description, monthly_rent, type,
        street_address, barangay, city, province,
        no_bedrooms, no_bathrooms, area_sqm,
        furnished_type, floor_level, max_occupants,
        lease_duration, amenities, lease_agreement_url,
        security_deposit, advance_rent,
        landlord:landlord_id (
          first_name,
          last_name
        )
      `,
      )
      .eq("id", apartmentId)
      .single();

    if (!aptError && aptData) {
      setApartment(aptData as Apartment);
    }

    const { data: tenancyData, error: tenancyError } = await supabase
      .from("tenancies")
      .select(
        `
        lease_start, lease_end, monthly_rent,
        tenant:users!tenant_id (
          first_name,
          last_name
        )
      `,
      )
      .eq("apartment_id", apartmentId)
      .eq("status", "active")
      .maybeSingle();

    if (!tenancyError && tenancyData) {
      setTenancy(tenancyData as ActiveTenancy);
    }

    setLoading(false);
  }, [apartmentId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleUploadLease = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${apartmentId}/lease_agreement.${fileExt}`;

      setUploading(true);

      // Read file as base64 instead of using fetch().blob()
      const base64 = await readAsStringAsync(file.uri, {
        encoding: "base64",
      });

      // Convert base64 → Uint8Array (what Supabase Storage actually needs)
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data: existingFiles } = await supabase.storage
        .from("lease-agreements")
        .list(apartmentId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(
          (f) => `${apartmentId}/${f.name}`,
        );
        await supabase.storage.from("lease-agreements").remove(filesToDelete);
      }

      const { error: uploadError } = await supabase.storage
        .from("lease-agreements")
        .upload(filePath, bytes, {
          upsert: true,
          contentType: file.mimeType ?? "application/octet-stream",
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("apartments")
        .update({ lease_agreement_url: filePath })
        .eq("id", apartmentId);

      if (updateError) throw updateError;

      Alert.alert("Success", "Lease agreement uploaded successfully.");
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to upload lease agreement.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleViewLease = async () => {
    if (!apartment?.lease_agreement_url) return;

    try {
      const { data, error } = await supabase.storage
        .from("lease-agreements")
        .createSignedUrl(apartment.lease_agreement_url, 3600);

      if (error || !data?.signedUrl) throw error;

      router.push({
        pathname: "/landlord/manage-apartment/[apartmentId]/description/lease-viewer",
        params: { apartmentId, fileUrl: data.signedUrl },
      });
    } catch (err) {
      Alert.alert("Error", "Could not open lease agreement.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Apartment Description" />}>
        <View className="flex-1 items-center justify-center mt-20">
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const landlordName = apartment?.landlord
    ? `${apartment.landlord.first_name} ${apartment.landlord.last_name}`
    : "—";

  const fullAddress = apartment
    ? `${apartment.street_address}, ${apartment.barangay}, ${apartment.city}, ${apartment.province}`
    : "—";

  const effectiveRent = tenancy?.monthly_rent ?? apartment?.monthly_rent;

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      header={
        <StandardHeader
          title="Apartment Description"
          onBackPress={() => router.replace(`/landlord/manage-apartment/${apartmentId}`)}
        />
      }
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-lg font-interSemiBold">
          Main Information
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/landlord/manage-apartment/${apartmentId}/description/edit-main`,
            )
          }
        >
          <SquarePen size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="mt-3">
        <Text className="text-xl font-interSemiBold text-foreground">
          {apartment?.name ?? "—"}
        </Text>
        <Text className="text-sm text-foreground">{fullAddress}</Text>
      </View>

      <View className="mt-5">
        <Text className="text-muted text-xs font-inter">Landlord</Text>
        <Text className="text-foreground text-base font-interMedium">
          {landlordName}
        </Text>
      </View>

      {tenancy && (
        <View className="flex-row mt-5">
          <View className="flex w-1/2">
            <Text className="text-muted text-xs font-inter">Lease Start</Text>
            <Text className="text-foreground text-base font-interMedium">
              {formatDate(tenancy.lease_start)}
            </Text>
          </View>
          <View className="flex w-1/2">
            <Text className="text-muted text-xs font-inter">Lease End</Text>
            <Text className="text-foreground text-base font-interMedium">
              {formatDate(tenancy.lease_end)}
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap">
        <View className="mt-5 flex w-1/2">
          <Text className="text-muted text-xs font-inter">Monthly Rent</Text>
          <Text className="text-foreground text-base font-interMedium">
            {formatCurrency(effectiveRent)}
          </Text>
        </View>
        <View className="mt-5 flex w-1/2">
          <Text className="text-muted text-xs font-inter">Security Deposit</Text>
          <Text className="text-foreground text-base font-interMedium">
            {formatCurrency(apartment?.security_deposit ?? 0)}
          </Text>
        </View>
        <View className="mt-5 flex w-1/2">
          <Text className="text-muted text-xs font-inter">Advance Rent</Text>
          <Text className="text-foreground text-base font-interMedium">
            {formatCurrency(apartment?.advance_rent ?? 0)}
          </Text>
        </View>
      </View>

      <Divider />

      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-base font-interSemiBold">
          Apartment Full Description
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/landlord/manage-apartment/${apartmentId}/description/edit-description`,
            )
          }
        >
          <SquarePen size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="mt-3 bg-surface border border-border p-4 rounded-2xl">
        <Text className="text-foreground text-sm font-inter">
          {apartment?.description ?? "—"}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-base font-interSemiBold mt-5">
          Room/Unit Details
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/landlord/manage-apartment/${apartmentId}/description/edit-specs`,
            )
          }
        >
          <SquarePen size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap justify-between mt-5">
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={House}
            customText={apartment?.type ?? "—"}
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Calendar}
            customText={apartment?.lease_duration ?? "—"}
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={BedDouble}
            customText={`${apartment?.no_bedrooms ?? "—"} Bedroom${apartment?.no_bedrooms !== 1 ? "s" : ""}`}
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Bath}
            customText={`${apartment?.no_bathrooms ?? "—"} Bathroom${apartment?.no_bathrooms !== 1 ? "s" : ""}`}
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Armchair}
            customText={apartment?.furnished_type ?? "—"}
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Building}
            customText={apartment?.floor_level ?? "—"}
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Users}
            customText={
              apartment?.max_occupants
                ? `Max ${apartment.max_occupants} Occupants`
                : "—"
            }
            iconColor={colors.gray400}
          />
        </View>
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Maximize}
            customText={apartment?.area_sqm ? `${apartment.area_sqm} sqm` : "—"}
            iconColor={colors.gray400}
          />
        </View>
      </View>

      {(apartment?.amenities?.length ?? 0) > 0 && (
        <>
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground text-base font-interSemiBold mt-5">
              Included Perks
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/landlord/manage-apartment/${apartmentId}/description/edit-perks`,
                )
              }
            >
              <SquarePen size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between mt-5">
            {apartment!.amenities.map((perk, index) => (
              <View className="w-1/2 mb-5" key={index}>
                <PerkItem iconColor={colors.primary} perkId={perk} />
              </View>
            ))}
          </View>
        </>
      )}

      <Divider />

      <View className="mt-5 gap-3">
        <Button
          variant="tertiary"
          isDisabled={!apartment?.lease_agreement_url}
          onPress={handleViewLease}
        >
          <FileText size={20} color={colors.textPrimary} />
          <Button.Label>View Lease Agreement</Button.Label>
        </Button>

        <Button isDisabled={uploading} onPress={handleUploadLease}>
          <Upload size={20} color={colors.secondaryForeground} />
          <Button.Label>
            {uploading ? "Uploading..." : "Upload Lease Agreement"}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
