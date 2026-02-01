"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Heart, Calendar, LogOut, Copy, Check, Camera, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  couple_id: string | null;
}

interface Couple {
  id: string;
  pair_code: string;
  anniversary_date: string | null;
  couple_name: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [coupleName, setCoupleName] = useState("");
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || "");

        if (profileData.couple_id) {
          const { data: coupleData } = await supabase
            .from("couples")
            .select("*")
            .eq("id", profileData.couple_id)
            .single();

          if (coupleData) {
            setCouple(coupleData);
            setCoupleName(coupleData.couple_name || "");
            setAnniversaryDate(coupleData.anniversary_date || "");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile?.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Construct simple public URL if getPublicUrl returns something we can't use directly or just use it
      // Standard supabase storage public url:
      // https://[project].supabase.co/storage/v1/object/public/avatars/[path]

      // Update profile immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated.",
        variant: "success",
      });

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCoupleSettings = async () => {
    if (!couple) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("couples")
        .update({
          couple_name: coupleName || null,
          anniversary_date: anniversaryDate || null,
        })
        .eq("id", couple.id);

      if (error) throw error;

      toast({
        title: "Couple settings updated",
        description: "Your couple settings have been saved.",
      });
    } catch (error) {
      console.error("Error saving couple settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyPairCode = async () => {
    if (!couple?.pair_code) return;
    await navigator.clipboard.writeText(couple.pair_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Settings className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3 text-glow-white">
          <Settings className="h-7 w-7 text-amber-200" />
          Settings
        </h1>
        <p className="text-white/60 mt-1 uppercase tracking-widest text-[10px] font-bold">Manage your account and couple preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-white/10 shadow-xl group-hover:border-rose-400/50 transition-colors">
                <AvatarImage src={profile?.avatar_url || "/images/placeholder.png"} />
                <AvatarFallback className="text-2xl font-serif bg-rose-900/20 text-rose-200">
                  {profile?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-6 h-6 text-white/90" />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
                  <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                </div>
              )}
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-3.5 h-3.5" />
              Change Photo
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-white/80 font-bold uppercase tracking-widest text-[10px] mb-2 block">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="border border-white/10"
              />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Couple Settings */}
      {couple && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Couple Settings
            </CardTitle>
            <CardDescription>Customize your love space</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="coupleName" className="text-white/80 font-bold uppercase tracking-widest text-[10px] mb-2 block">Couple Name</Label>
              <Input
                id="coupleName"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="e.g., Jack & Jill"
                className="border border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="anniversary" className="flex items-center gap-1 text-white/80 font-bold uppercase tracking-widest text-[10px] mb-2 block">
                <Calendar className="h-3 w-3" />
                Anniversary Date
              </Label>
              <Input
                id="anniversary"
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="border border-white/10"
              />
            </div>
            <div>
              <Label>Pair Code</Label>
              <div className="flex gap-2">
                <Input value={couple.pair_code} readOnly className="font-mono border border-white/10" />
                <Button variant="outline" size="icon" onClick={copyPairCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share this code with your partner to connect
              </p>
            </div>
            <Button onClick={saveCoupleSettings} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving..." : "Save Couple Settings"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Card className="border-destructive/10 border border-white/10">
        <CardContent className="pt-6">
          <Button variant="outline" className="w-full gap-2 bg-transparent border border-white/10" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 text-destructive" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
