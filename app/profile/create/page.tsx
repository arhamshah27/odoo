"use client"

import type React from "react"

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
import { Users, Plus, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export default function CreateProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true) // Use loading for initial check and form submission
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
    // If no user, redirect to login. This handles cases where user might directly access /profile/create
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Check if profile already exists. If it does, redirect to dashboard.
    // This prevents users from creating multiple profiles or re-accessing this page after creation.
    const checkExistingProfile = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

        if (data) {
          // Profile exists, redirect to dashboard
          router.push("/dashboard")
          return
        }
        // If error is PGRST116 (no rows found), it means profile doesn't exist, which is expected for this page.
        // Any other error should be logged.
        if (error && error.code !== "PGRST116") {
          console.error("Error checking existing profile:", error)
          setError(error.message || "Failed to check existing profile.")
        }
      } catch (err: any) {
        console.error("Unexpected error during profile check:", err)
        setError(err.message || "An unexpected error occurred during profile check.")
      } finally {
        setLoading(false)
      }
    }

    checkExistingProfile()

    // Pre-fill name from user metadata if available
    if (user.user_metadata?.name) {
      setFormData((prev) => ({ ...prev, name: user.user_metadata.name }))
    }
  }, [user, router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        name: formData.name,
        email: user.email!,
        location: formData.location || null,
        bio: formData.bio || null,
        skills_offered: formData.skills_offered,
        skills_wanted: formData.skills_wanted,
        availability: formData.availability,
        is_public: formData.is_public,
      })

      if (error) {
        console.error("Supabase upsert error:", error)
        throw error
      }

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error creating profile:", error)
      setError(error.message || "An error occurred while creating your profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking for existing profile or if user is not yet loaded
  if (loading && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // If no user, return null (useEffect will redirect to login)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">SkillSwap</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Your Profile</h2>
          <p className="mt-2 text-gray-600">Tell others about your skills and what you'd like to learn</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This information will be visible to other users when you make your profile public
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
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
                    placeholder="Tell others about yourself, your background, and interests..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Skills Offered */}
              <div className="space-y-4">
                <div>
                  <Label>Skills You Can Offer</Label>
                  <p className="text-sm text-gray-500 mb-2">What skills can you teach or help others with?</p>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="e.g., React, Photography, Spanish"
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
                  <div className="flex flex-wrap gap-2 mt-2">
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

                {/* Skills Wanted */}
                <div>
                  <Label>Skills You Want to Learn</Label>
                  <p className="text-sm text-gray-500 mb-2">What skills would you like to learn from others?</p>
                  <div className="flex gap-2">
                    <Input
                      value={wantedSkillInput}
                      onChange={(e) => setWantedSkillInput(e.target.value)}
                      placeholder="e.g., Guitar, Cooking, Python"
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
                  <div className="flex flex-wrap gap-2 mt-2">
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
              </div>

              {/* Availability */}
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

              {/* Privacy Settings */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-gray-500">Allow others to find and view your profile</p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Profile..." : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
