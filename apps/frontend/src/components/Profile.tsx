import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Check, User, Workflow, Calendar, Mail } from "lucide-react";
import { apiGetProfile, apiUpdateProfile, clearAuthSession } from "@/http";
import { AVATAR_OPTIONS } from "@/lib/utils";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("trader_pro");
  const [email, setEmail] = useState("trader@example.com");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  const [memberSince, setMemberSince] = useState("January 2024");

  useEffect(() => {
    const loadProfile = async () => {
        try {
            const res = await apiGetProfile();
            setUsername(res.username);
            setEmail(res.email);
            setSelectedAvatar(res.avatarUrl);
            setTotalWorkflows(res.totalWorkflows);
            setMemberSince(res.memberSince);
        } catch (err) {
            clearAuthSession();
            toast.warning("Session expired", {
              description: "Please sign in again to continue.",
            });
            navigate("/signin");
        }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      await apiUpdateProfile({
        email,
        avatarUrl: selectedAvatar,
      });
      toast.success("Profile updated", {
        description: "Your avatar preferences were saved.",
      });
    } catch (error: any) {
      toast.error("Update failed", {
        description: error?.response?.data?.message ?? "Could not save profile changes.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-black via-neutral-950 to-black text-white px-6 py-10 pt-28">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-neutral-400 hover:bg-neutral-800 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div>
          <p className="text-xs uppercase tracking-widest text-[#f17463]">
            Profile
          </p>
          <h1 className="text-2xl font-semibold">Your Account</h1>
          <p className="text-sm text-neutral-400">
            Manage your profile settings and preferences.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-xl">
        {/* Avatar + Name */}
        <div className="flex items-center gap-5 mb-8">
          <Avatar className="h-20 w-20 ring-2 ring-orange-500/60 ring-offset-2 ring-offset-black">
            <AvatarImage src={selectedAvatar} />
            <AvatarFallback>TP</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-lg font-semibold">{username}</h2>
            <p className="text-sm text-neutral-400">{email}</p>
          </div>
        </div>

        {/* Avatar selection */}
        <div className="mb-8">
          <Label className="text-sm text-neutral-300 mb-3 block">
            Select Avatar
          </Label>

          <div className="flex gap-4">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`relative rounded-full p-1 transition
                  ${
                    selectedAvatar === avatar
                      ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-black"
                      : "hover:ring-2 hover:ring-neutral-600 hover:ring-offset-2 hover:ring-offset-black"
                  }`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatar} />
                </Avatar>

                {selectedAvatar === avatar && (
                  <Check className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-orange-500 p-0.5 text-black" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Username */}
          <div className="space-y-2">
            <Label className="text-neutral-300">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                value={username}
                className="h-11 bg-neutral-800 border-neutral-700 pl-10 text-white focus-visible:ring-orange-500"
                readOnly
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-neutral-300">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                value={email}
                className="h-11 bg-neutral-800 border-neutral-700 pl-10 text-white focus-visible:ring-orange-500"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="bg-[#da5241] hover:bg-[#da5241] cursor-pointer hover:scale-105 text-white font-medium px-6"
        >
          Save Changes
        </Button>
      </div>

      {/* Stats */}
      <div className="mx-auto mt-8 max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 flex items-center gap-4">
          <Workflow className="h-8 w-8 text-[#f17463]" />
          <div>
            <p className="text-2xl font-semibold">{totalWorkflows}</p>
            <p className="text-sm text-neutral-400">Total Workflows</p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 flex items-center gap-4">
          <Calendar className="h-8 w-8 text-[#f17463]" />
          <div>
            <p className="text-2xl font-semibold">{memberSince}</p>
            <p className="text-sm text-neutral-400">Member Since</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
