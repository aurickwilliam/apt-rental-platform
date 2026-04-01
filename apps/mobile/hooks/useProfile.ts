import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';

type UserProfile = {
  first_name: string;
  last_name: string;
  email: string | null;
  avatar_url: string | null;
  account_status: string;
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
        .select('first_name, last_name, email, avatar_url, account_status')
        .eq('user_id', user.id)  // user_id links to auth.users
        .single();

      if (error) console.error(error);
      else setProfile(data);

      setLoading(false);
    };

    fetchProfile();
  }, []);

  return { profile, loading };
}