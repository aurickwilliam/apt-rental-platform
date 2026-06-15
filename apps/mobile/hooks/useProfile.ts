import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';

export type UserProfile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  account_status: string;
  background_url: string | null;
  role: string | null;
  gender: string | null;
  birth_date: string | null;   // "YYYY-MM-DD"
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  postal_code: number | null; 
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, first_name, last_name, middle_name, email, mobile_number, avatar_url, account_status, background_url, role, gender, birth_date, street_address, barangay, city, province, postal_code')
        .eq('user_id', user.id)
        .single();

      if (error) console.error('useProfile error:', error);
      else setProfile(data as UserProfile);

      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}