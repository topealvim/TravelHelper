"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

export function Header() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
    getProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <MapPin className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TravelHelper</span>
        </button>
        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile.display_name}
            </span>
          )}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : profile?.display_name ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          ) : null}
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
