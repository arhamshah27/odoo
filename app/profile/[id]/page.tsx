"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Clock, Users, ArrowLeft, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  user_id: string
  name: string
  location?: string
  bio?: string
  avatar_url?: string
  skills_offered: string[]
  skills_wanted: string[]
  availability: string
  is_public: boolean
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null) // State for current user's profile
  const [requestMessage, setRequestMessage] = useState("")
  const [selectedSkillOffered, setSelectedSkillOffered] = useState("")
  const [selectedSkillWanted, setSelectedSkillWanted] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchProfiles()
    }
  }, [params.id, user]) // Add user to dependency array to refetch if user changes

  const fetchProfiles = async () => {
    setLoading(true)
    setError("")
    try {
      // Fetch the profile of the user being viewed
      const { data: viewedProfileData, error: viewedProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .eq("is_public", true)
        .single()

      if (viewedProfileError) throw viewedProfileError
      setProfile(viewedProfileData)

      // Fetch the current logged-in user's profile if they exist
      if (user) {
        const { data: currentProfileData, error: currentProfileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (currentProfileError && currentProfileError.code !== "PGRST116") {
          // PGRST116 means no rows found, which is fine if the user hasn't created a profile yet
          console.error("Error fetching current user profile:", currentProfileError)
          setError(currentProfileError.message || "Failed to load your profile data.")
        }
        setCurrentUserProfile(currentProfileData)
      }
    } catch (error: any) {
      setError(error.message || "Profile not found or an error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!user || !profile || !currentUserProfile) {
      router.push("/auth/login")
      return
    }

    if (!requestMessage.trim() || !selectedSkillOffered || !selectedSkillWanted) {
      setError("Please fill in all fields")
      return
    }

    setSending(true)
    setError("")

    try {
      const { error } = await supabase.from("skill_requests").insert({
        from_user_id: user.id,
        to_user_id: profile.user_id,
        message: requestMessage.trim(),
        skill_offered: selectedSkillOffered,
        skill_wanted: selectedSkillWanted,
        status: "pending",
      })

      if (error) throw error

      setSuccess("Request sent successfully!")
      setIsRequestDialogOpen(false)
      setRequestMessage("")
      setSelectedSkillOffered("")
      setSelectedSkillWanted("")
    } catch (error: any) {
      setError(error.message || "Failed to send request")
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Profile not found or not public</p>
          <Link href="/browse">
            <Button className="mt-4">Browse Other Profiles</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/browse">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Browse
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Profile</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-24 w-24 mx-auto sm:mx-0">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                    <AvatarFallback className="text-2xl">
                      {profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>

                    <div className="flex flex-col sm:flex-row gap-4 text-gray-600 mb-4">
                      {profile.location && (
                        <div className="flex items-center gap-1 justify-center sm:justify-start">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 justify-center sm:justify-start">
                        <Clock className="h-4 w-4" />
                        <span>Available {profile.availability}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 justify-center sm:justify-start mb-4">
                      <div className="text-sm text-gray-600">Member since {formatDate(profile.created_at)}</div>
                    </div>

                    {profile.bio && <p className="text-gray-700 leading-relaxed">{profile.bio}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Offered */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  Skills I Can Offer
                </CardTitle>
                <CardDescription>{profile.name.split(" ")[0]} can help you learn these skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_offered?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                      {skill}
                    </Badge>
                  ))}
                  {(!profile.skills_offered || profile.skills_offered.length === 0) && (
                    <p className="text-gray-500 text-sm">No skills listed yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Wanted */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  Skills I Want to Learn
                </CardTitle>
                <CardDescription>{profile.name.split(" ")[0]} is looking to learn these skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_wanted?.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {skill}
                    </Badge>
                  ))}
                  {(!profile.skills_wanted || profile.skills_wanted.length === 0) && (
                    <p className="text-gray-500 text-sm">No skills listed yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Connect</CardTitle>
                <CardDescription>Start a skill exchange with {profile.name.split(" ")[0]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {user && user.id !== profile.user_id ? (
                  <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Send Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Skill Exchange Request</DialogTitle>
                        <DialogDescription>
                          Send a message to {profile.name} to propose a skill exchange.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Skill you can offer</label>
                          <select
                            value={selectedSkillOffered}
                            onChange={(e) => setSelectedSkillOffered(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md"
                            required
                          >
                            <option value="">Select a skill you can offer...</option>
                            {currentUserProfile?.skills_offered?.map((skill, index) => (
                              <option key={index} value={skill}>
                                {skill}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Skill you want to learn</label>
                          <select
                            value={selectedSkillWanted}
                            onChange={(e) => setSelectedSkillWanted(e.target.value)}
                            className="w-full mt-1 p-2 border rounded-md"
                            required
                          >
                            <option value="">Select a skill you want to learn...</option>
                            {profile.skills_offered?.map((skill, index) => (
                              <option key={index} value={skill}>
                                {skill}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Your Message</label>
                          <Textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            placeholder={`Hi ${profile.name.split(" ")[0]}, I'd love to exchange skills with you. I can help you with ${selectedSkillOffered || "[skill]"} and I'm interested in learning ${selectedSkillWanted || "[skill]"} from you.`}
                            className="mt-1 min-h-[120px]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendRequest}
                          disabled={!requestMessage.trim() || !selectedSkillOffered || !selectedSkillWanted || sending}
                        >
                          {sending ? "Sending..." : "Send Request"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : user?.id === profile.user_id ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">This is your profile</p>
                    <Link href="/profile/edit">
                      <Button variant="outline" className="w-full bg-transparent">
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">Sign in to send requests</p>
                    <Link href="/auth/login">
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills Offered</span>
                  <span className="font-medium">{profile.skills_offered?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills Wanted</span>
                  <span className="font-medium">{profile.skills_wanted?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">{formatDate(profile.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
