import { View } from 'react-native';
import type { ReactNode } from 'react';
import { SkeletonGroup } from 'heroui-native';

import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';

function SkeletonRow({ widths }: { widths: [string, string] }) {
  return (
    <View className="flex-row gap-3">
      <SkeletonGroup.Item className={`h-10 ${widths[0]} rounded-lg`} />
      <SkeletonGroup.Item className={`h-10 ${widths[1]} rounded-lg`} />
    </View>
  );
}

function SectionCard({ titleClass, children }: { titleClass: string; children: ReactNode }) {
  return (
    <View className="bg-surface border border-border rounded-3xl p-4 gap-4">
      <SkeletonGroup.Item className={`h-6 ${titleClass} rounded-md`} />
      {children}
    </View>
  );
}

export default function TenantApplicationDetailsSkeleton() {
  return (
    <ScreenWrapper
      header={<StandardHeader title="Application Details" />}
      scrollable
      className="p-5"
    >
      <SkeletonGroup isLoading>
        <View className="gap-4 pb-6">
          {/* Apartment name / address */}
          <View className="gap-2">
            <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
            <SkeletonGroup.Item className="h-6 w-56 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-48 rounded-md" />
          </View>

          {/* Tenant summary card */}
          <SkeletonGroup isLoading className="flex-row items-center gap-3 bg-surface border border-border rounded-3xl p-4">
            <SkeletonGroup.Item className="h-12 w-12 rounded-full" />
            <View className="flex-1 gap-1.5">
              <SkeletonGroup.Item className="h-4 w-36 rounded-md" />
              <SkeletonGroup.Item className="h-3 w-44 rounded-md" />
              <SkeletonGroup.Item className="h-3 w-28 rounded-md" />
            </View>
            <SkeletonGroup.Item className="h-7 w-20 rounded-full" />
          </SkeletonGroup>

          {/* Application / Employment cards */}
          <SectionCard titleClass="w-44">
            <SkeletonRow widths={['flex-1', 'flex-1']} />
            <SkeletonRow widths={['flex-1', 'flex-1']} />
          </SectionCard>
          <SectionCard titleClass="w-32">
            <SkeletonRow widths={['flex-1', 'flex-1']} />
            <SkeletonRow widths={['flex-1', 'flex-1']} />
          </SectionCard>

          {/* Preferences card */}
          <SectionCard titleClass="w-28">
            <SkeletonRow widths={['flex-1', 'flex-1']} />
            <SkeletonGroup.Item className="h-10 w-1/2 rounded-lg" />
          </SectionCard>

          {/* Previous landlord card */}
          <SectionCard titleClass="w-40">
            <SkeletonRow widths={['flex-1', 'flex-1']} />
          </SectionCard>

          {/* Documents card */}
          <SectionCard titleClass="w-28">
            {[...Array(4)].map((_, i) => (
              <SkeletonGroup.Item key={i} className="h-14 w-full rounded-xl" />
            ))}
          </SectionCard>

          {/* Message card */}
          <SectionCard titleClass="w-48">
            <SkeletonGroup.Item className="h-4 w-full rounded-md" />
            <SkeletonGroup.Item className="h-4 w-4/5 rounded-md" />
          </SectionCard>
        </View>
      </SkeletonGroup>
    </ScreenWrapper>
  );
}
