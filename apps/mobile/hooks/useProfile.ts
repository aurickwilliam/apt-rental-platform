import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';

type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  account_status: string;
  background_url: string | null;
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
        .select('id, first_name, last_name, email, mobile_number, avatar_url, account_status, background_url')
        .eq('user_id', user.id)
        .single();

      if (error) console.error(error);
      else setProfile(data);

      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}