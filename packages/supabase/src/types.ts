// Auto-generated types from Supabase
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/types.ts
// Or link your project and run: npx supabase gen types typescript --linked > src/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Placeholder database type - replace with generated types from Supabase CLI
export interface Database {
  public: {
    Tables: {
      // Example table structure - replace with your actual tables
      // users: {
      //   Row: {
      //     id: string;
      //     email: string;
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     email: string;
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     email?: string;
      //     created_at?: string;
      //   };
      // };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
