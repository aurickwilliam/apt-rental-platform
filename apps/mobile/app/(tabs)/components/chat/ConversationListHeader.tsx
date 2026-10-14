import type { ReactNode } from 'react'
import { View, Text } from 'react-native'

import { Button, SearchField } from 'heroui-native'

import { IconArchive } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

interface ConversationListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  /** Opens the archived chats screen (icon button at the top right). */
  onOpenArchived?: () => void;
  /** Rendered under the search field (e.g. the landlord filter tabs). */
  children?: ReactNode;
}

/** Messages title and search field shared by the tenant and landlord lists. */
export default function ConversationListHeader({
  searchQuery,
  onSearchChange,
  showSearch,
  onOpenArchived,
  children,
}: ConversationListHeaderProps) {
  const { colors } = useColors();

  return (
    <View>
      <View className='flex-row items-center justify-between'>
        <Text className='text-primary text-3xl font-nunitoBold' accessibilityRole='header'>
          Messages
        </Text>

        {onOpenArchived ? (
          <Button
            variant='ghost'
            isIconOnly
            onPress={onOpenArchived}
            accessibilityLabel='Archived chats'
          >
            <IconArchive size={26} color={colors.gray500} />
          </Button>
        ) : null}
      </View>

      {showSearch && (
        <View className='mt-3'>
          <SearchField value={searchQuery} onChange={onSearchChange}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input
                placeholder='Search messages...'
                className='flex-1 shadow-none'
                accessibilityLabel='Search messages'
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>
      )}

      {children}
    </View>
  );
}
