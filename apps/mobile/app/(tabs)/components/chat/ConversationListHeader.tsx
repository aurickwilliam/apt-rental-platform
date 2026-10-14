import type { ReactNode } from 'react'
import { View, Text } from 'react-native'

import { SearchField } from 'heroui-native'

interface ConversationListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  /** Rendered under the search field (e.g. the landlord filter tabs). */
  children?: ReactNode;
}

/** Messages title and search field shared by the tenant and landlord lists. */
export default function ConversationListHeader({
  searchQuery,
  onSearchChange,
  showSearch,
  children,
}: ConversationListHeaderProps) {
  return (
    <View>
      <Text className='text-primary text-3xl font-nunitoBold' accessibilityRole='header'>
        Messages
      </Text>

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
