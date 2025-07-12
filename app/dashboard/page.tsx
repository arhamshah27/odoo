"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, Users, Settings, MessageCircle, CheckCircle, XCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
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

interface SkillRequest {
  id: string
  from_user_id: string
  to_user_id: string
  message: string
  skill_offered: string
  skill_wanted: string
  status: "pending" | "accepted" | "declined" | "completed"
  created_at: string
  from_profile?: Profile
  to_profile?: Profile
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [incomingRequests, setIncomingRequests] = useState<SkillRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SkillRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchUserData()
  }, [user, router])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Profile doesn't exist, redirect to create
          router.push("/profile/create")
          return
        }
        throw profileError
      }

      setProfile(profileData)

      // Fetch incoming requests
      const { data: incomingData, error: incomingError } = await supabase
        .from("skill_requests")
        .select(`
          *,
          from_profile:profiles!skill_requests_from_user_id_fkey(*)
        `)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false })

      if (incomingError) throw incomingError
      setIncomingRequests(incomingData || [])

      // Fetch sent requests
      const { data: sentData, error: sentError } = await supabase
        .from("skill_requests")
        .select(`
          *,
          to_profile:profiles!skill_requests_to_user_id_fkey(*)
        `)
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false })

      if (sentError) throw sentError
      setSentRequests(sentData || [])
    } catch (error: any) {
      setError(error.message || "An error occurred while fetching data")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: "accepted" | "declined") => {
    try {
      const { error } = await supabase
        .from("skill_requests")
        .update({
          status: action,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (error) throw error

      // Refresh requests
      fetchUserData()
    } catch (error: any) {
      setError(error.message || "An error occurred while updating the request")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error: any) {
      setError(error.message || "An error occurred while signing out")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Profile not found</p>
          <Link href="/profile/create">
            <Button className="mt-4">Create Profile</Button>
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/browse">
                <Button variant="outline">Browse Members</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {incomingRequests.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {incomingRequests.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Profile */}
              <div className="lg:col-span-2">
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

                        {profile.bio && <p className="text-gray-700 leading-relaxed">{profile.bio}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Skills I Offer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills_offered?.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {(!profile.skills_offered || profile.skills_offered.length === 0) && (
                          <p className="text-gray-500 text-sm">No skills added yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Skills I Want</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills_wanted?.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                        {(!profile.skills_wanted || profile.skills_wanted.length === 0) && (
                          <p className="text-gray-500 text-sm">No skills added yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
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
                      <span className="text-gray-600">Total Requests</span>
                      <span className="font-medium">{incomingRequests.length + sentRequests.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profile Status</span>
                      <span className="font-medium">{profile.is_public ? "Public" : "Private"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/profile/edit">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                    <Link href="/browse">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Users className="h-4 w-4 mr-2" />
                        Browse Members
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incoming Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Incoming Requests ({incomingRequests.length})
                  </CardTitle>
                  <CardDescription>People who want to exchange skills with you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.from_profile?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {request.from_profile?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{request.from_profile?.name}</h4>
                            <span className="text-xs text-gray-500">{formatDate(request.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              Offers: {request.skill_offered}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Wants: {request.skill_wanted}
                            </Badge>
                            <Badge variant={request.status === "pending" ? "default" : "secondary"} className="text-xs">
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request.id, "accepted")}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestAction(request.id, "declined")}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {incomingRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No incoming requests yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sent Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Sent Requests ({sentRequests.length})
                  </CardTitle>
                  <CardDescription>Your requests to other members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.to_profile?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {request.to_profile?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">To: {request.to_profile?.name}</h4>
                            <span className="text-xs text-gray-500">{formatDate(request.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              You offer: {request.skill_offered}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              You want: {request.skill_wanted}
                            </Badge>
                            <Badge
                              variant={request.status === "accepted" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sentRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sent requests yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent skill exchanges and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...incomingRequests, ...sentRequests]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((request) => (
                      <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            request.status === "accepted"
                              ? "bg-green-500"
                              : request.status === "declined"
                                ? "bg-red-500"
                                : request.status === "completed"
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {request.from_user_id === user?.id
                              ? `Sent request to ${request.to_profile?.name}`
                              : `Received request from ${request.from_profile?.name}`}
                          </p>
                          <p className="text-xs text-gray-600">
                            {request.skill_offered} ↔ {request.skill_wanted} • {formatDate(request.created_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    ))}

                  {[...incomingRequests, ...sentRequests].length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity yet</p>
                      <p className="text-sm mt-2">Start by browsing members and sending skill exchange requests!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
