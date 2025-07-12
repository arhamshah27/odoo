"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, MapPin, Clock, ArrowLeft, MessageSquare, Calendar, Mail } from "lucide-react"
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
}

export default function ProfileViewPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const [requestData, setRequestData] = useState({
    message: "",
    skill_offered: "",
    skill_wanted: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchProfile()
    }
  }, [params.id])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .eq("is_public", true)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error: any) {
      setError(error.message || "Profile not found")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const sendRequest = async () => {
    if (!user || !profile || !userProfile) {
      router.push("/auth/login")
      return
    }

    if (!requestData.message.trim() || !requestData.skill_offered || !requestData.skill_wanted) {
      setError("Please fill in all fields")
      return
    }

    setSending(true)
    setError("")

    try {
      const { error } = await supabase.from("skill_requests").insert({
        from_user_id: user.id,
        to_user_id: profile.user_id,
        message: requestData.message,
        skill_offered: requestData.skill_offered,
        skill_wanted: requestData.skill_wanted,
        status: "pending",
      })

      if (error) throw error

      setSuccess("Request sent successfully!")
      setDialogOpen(false)
      setRequestData({ message: "", skill_offered: "", skill_wanted: "" })
    } catch (error: any) {
      setError(error.message || "Failed to send request")
    } finally {
      setSending(false)
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">This profile may be private or doesn't exist.</p>
          <Link href="/browse">
            <Button>Browse Other Members</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.user_id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/browse" className="text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">SkillSwap</h1>
              </div>
            </div>
            {user && (
              <nav className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline">My Profile</Button>
                </Link>
              </nav>
            )}
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
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
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
                {profile.location && (
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="capitalize">{profile.availability}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>

                {!isOwnProfile && user && userProfile && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Skill Exchange Request</DialogTitle>
                        <DialogDescription>Propose a skill exchange with {profile.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Skill you can offer</Label>
                          <Select
                            value={requestData.skill_offered}
                            onValueChange={(value) => setRequestData({ ...requestData, skill_offered: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a skill you can teach" />
                            </SelectTrigger>
                            <SelectContent>
                              {userProfile.skills_offered?.map((skill) => (
                                <SelectItem key={skill} value={skill}>
                                  {skill}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Skill you want to learn</Label>
                          <Select
                            value={requestData.skill_wanted}
                            onValueChange={(value) => setRequestData({ ...requestData, skill_wanted: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a skill you want to learn" />
                            </SelectTrigger>
                            <SelectContent>
                              {profile.skills_offered?.map((skill) => (
                                <SelectItem key={skill} value={skill}>
                                  {skill}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea
                            value={requestData.message}
                            onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                            placeholder="Introduce yourself and explain why you'd like to exchange skills..."
                            rows={4}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={sendRequest} disabled={sending} className="flex-1">
                            {sending ? "Sending..." : "Send Request"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {!user && (
                  <Link href="/auth/login">
                    <Button className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Login to Connect
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills Offered */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Offered</CardTitle>
                <CardDescription>{profile.name.split(" ")[0]} can help you learn these skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_offered?.length > 0 ? (
                    profile.skills_offered.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills listed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills Wanted */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Wanted</CardTitle>
                <CardDescription>{profile.name.split(" ")[0]} is looking to learn these skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_wanted?.length > 0 ? (
                    profile.skills_wanted.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-sm">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills listed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="capitalize text-gray-700">{profile.availability}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {profile.availability === "flexible" && "Available at flexible times"}
                  {profile.availability === "weekends" && "Available on weekends"}
                  {profile.availability === "evenings" && "Available in the evenings"}
                  {profile.availability === "weekdays" && "Available on weekdays"}
                  {profile.availability === "limited" && "Limited availability"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
