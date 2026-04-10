import { View } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import TextBox from '@/components/inputs/TextBox'
import PillButton from '@/components/buttons/PillButton'
import { supabase } from '@repo/supabase'

export default function EditDescription() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const [description, setDescription] = useState<string>('');
  const [originalDescription, setOriginalDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch current description on mount
  useEffect(() => {
    const fetchDescription = async () => {
      const { data, error } = await supabase
        .from('apartments')
        .select('description')
        .eq('id', apartmentId)
        .single();

      if (error) {
        console.error('Error fetching description:', error);
        return;
      }

      setDescription(data.description ?? '');
      setOriginalDescription(data.description ?? '');
    };

    fetchDescription();
  }, [apartmentId]);

  // Validation
  const validate = (): boolean => {
    if (!description.trim()) {
      setError('Description is required.');
      return false;
    }
    if (description.trim() === originalDescription.trim()) {
      setError('No changes were made.');
      return false;
    }
    setError('');
    return true;
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    if (!validate()) return;

    setLoading(true);

    const { error } = await supabase
      .from('apartments')
      .update({
        description: description.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', apartmentId);

    setLoading(false);

    if (error) {
      console.error('Error updating description:', error);
      setError('Failed to save changes. Please try again.');
      return;
    }

    router.push(`/manage-apartment/${apartmentId}/description`);
  };

  return (
    <ScreenWrapper
      className='p-5'
      header={<StandardHeader title='Edit Description' />}
    >
      <TextBox
        label='Description:'
        placeholder='Enter apartment description'
        boxHeight={500}
        required
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          if (error) setError('');
        }}
        error={error}
      />
      <View className='flex-1' />
      <PillButton
        label={loading ? 'Saving...' : 'Save Changes'}
        onPress={handleSaveChanges}
      />
    </ScreenWrapper>
  );
}