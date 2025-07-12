"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, X, ArrowLeft, Edit, Save } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  user_id: string
  name: string
  email: string
  location?: string
  bio?: string
  avatar_url?: string
  skills_offered: string[]
  skills_wanted: string[]
  availability: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [wantedSkillInput, setWantedSkillInput] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    bio: "",
    skills_offered: [] as string[],
    skills_wanted: [] as string[],
    availability: "flexible",
    is_public: true,
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchProfile()
  }, [user, router])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, redirect to create
          router.push("/profile/create")
          return
        }
        throw error
      }

      setProfile(data)
      setFormData({
        name: data.name,
        location: data.location || "",
        bio: data.bio || "",
        skills_offered: data.skills_offered || [],
        skills_wanted: data.skills_wanted || [],
        availability: data.availability,
        is_public: data.is_public,
      })
    } catch (error: any) {
      setError(error.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const addSkill = (skill: string, type: "offered" | "wanted") => {
    if (!skill.trim()) return

    const field = type === "offered" ? "skills_offered" : "skills_wanted"
    if (!formData[field].includes(skill.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], skill.trim()],
      }))
    }

    if (type === "offered") {
      setSkillInput("")
    } else {
      setWantedSkillInput("")
    }
  }

  const removeSkill = (skill: string, type: "offered" | "wanted") => {
    const field = type === "offered" ? "skills_offered" : "skills_wanted"
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((s) => s !== skill),
    }))
  }

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    setError("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          location: formData.location || null,
          bio: formData.bio || null,
          skills_offered: formData.skills_offered,
          skills_wanted: formData.skills_wanted,
          availability: formData.availability,
          is_public: formData.is_public,
        })
        .eq("user_id", user.id)

      if (error) throw error

      await fetchProfile()
      setEditing(false)
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your skills and information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button onClick={() => setEditing(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{profile.name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
                {profile.location && <p className="text-sm text-gray-500">{profile.location}</p>}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Availability</Label>
                    <p className="text-sm text-gray-600 capitalize">{profile.availability}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Profile Status</Label>
                    <p className="text-sm text-gray-600">{profile.is_public ? "Public" : "Private"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm text-gray-600">{new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Availability</Label>
                      <Select
                        value={formData.availability}
                        onValueChange={(value) => setFormData({ ...formData, availability: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flexible">Flexible</SelectItem>
                          <SelectItem value="weekends">Weekends Only</SelectItem>
                          <SelectItem value="evenings">Evenings</SelectItem>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="limited">Limited Availability</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Public Profile</Label>
                        <p className="text-sm text-gray-500">Allow others to find your profile</p>
                      </div>
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-gray-900">{profile.name}</p>
                    </div>
                    {profile.location && (
                      <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <p className="text-gray-900">{profile.location}</p>
                      </div>
                    )}
                    {profile.bio && (
                      <div>
                        <Label className="text-sm font-medium">Bio</Label>
                        <p className="text-gray-900">{profile.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Skills Offered */}
            <Card>
              <CardHeader>
                <CardTitle>Skills I Can Offer</CardTitle>
                <CardDescription>Skills you can teach or help others with</CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkill(skillInput, "offered")
                          }
                        }}
                      />
                      <Button type="button" onClick={() => addSkill(skillInput, "offered")} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills_offered.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill, "offered")}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills_offered?.length > 0 ? (
                      profile.skills_offered.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills Wanted */}
            <Card>
              <CardHeader>
                <CardTitle>Skills I Want to Learn</CardTitle>
                <CardDescription>Skills you'd like to learn from others</CardDescription>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={wantedSkillInput}
                        onChange={(e) => setWantedSkillInput(e.target.value)}
                        placeholder="Add a skill you want to learn..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkill(wantedSkillInput, "wanted")
                          }
                        }}
                      />
                      <Button type="button" onClick={() => addSkill(wantedSkillInput, "wanted")} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills_wanted.map((skill) => (
                        <Badge key={skill} variant="outline" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill, "wanted")}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills_wanted?.length > 0 ? (
                      profile.skills_wanted.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No skills added yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
