"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageSquare, Clock, CheckCircle, XCircle, User, Search, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

interface Profile {
  id: string
  name: string
  location?: string
  avatar_url?: string
  skills_offered: string[]
  skills_wanted: string[]
}

interface SkillRequest {
  id: string
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
  const [sentRequests, setSentRequests] = useState<SkillRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<SkillRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
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
          router.push("/profile/create")
          return
        }
        throw profileError
      }

      setProfile(profileData)

      // Fetch sent requests
      const { data: sentData, error: sentError } = await supabase
        .from("skill_requests")
        .select(`
          *,
          to_profile:profiles!skill_requests_to_user_id_fkey(id, name, avatar_url, skills_offered, skills_wanted)
        `)
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false })

      if (sentError) throw sentError

      // Fetch received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from("skill_requests")
        .select(`
          *,
          from_profile:profiles!skill_requests_from_user_id_fkey(id, name, avatar_url, skills_offered, skills_wanted)
        `)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false })

      if (receivedError) throw receivedError

      setSentRequests(sentData || [])
      setReceivedRequests(receivedData || [])
    } catch (error: any) {
      setError(error.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: "accepted" | "declined") => {
    try {
      const { error } = await supabase.from("skill_requests").update({ status }).eq("id", requestId)

      if (error) throw error

      await fetchDashboardData()
    } catch (error: any) {
      setError(error.message || "Failed to update request")
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
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SkillSwap</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/browse">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline">
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile.name}!</h2>
              <p className="text-gray-600">Manage your skill exchanges and discover new opportunities</p>
            </div>
            <Link href="/browse">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Find Skills
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sent Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{sentRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Received Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{receivedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Exchanges</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {[...sentRequests, ...receivedRequests].filter((r) => r.status === "accepted").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Skills Offered</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.skills_offered?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Tabs */}
        <Tabs defaultValue="received" className="space-y-6">
          <TabsList>
            <TabsTrigger value="received">
              Received Requests ({receivedRequests.filter((r) => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="sent">Sent Requests ({sentRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skill Exchange Requests</CardTitle>
                <CardDescription>People who want to learn from you</CardDescription>
              </CardHeader>
              <CardContent>
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No requests received yet</p>
                    <Link href="/browse">
                      <Button variant="outline">
                        Browse Members <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar>
                              <AvatarImage
                                src={request.from_profile?.avatar_url || "/placeholder.svg"}
                                alt={request.from_profile?.name}
                              />
                              <AvatarFallback>
                                {request.from_profile?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{request.from_profile?.name}</h4>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(request.status)}
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                                  >
                                    {request.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span>
                                  Offers: <Badge variant="secondary">{request.skill_offered}</Badge>
                                </span>
                                <span>
                                  Wants: <Badge variant="outline">{request.skill_wanted}</Badge>
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{request.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateRequestStatus(request.id, "accepted")}>
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRequestStatus(request.id, "declined")}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Requests</CardTitle>
                <CardDescription>Skill exchange requests you've sent</CardDescription>
              </CardHeader>
              <CardContent>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No requests sent yet</p>
                    <Link href="/browse">
                      <Button variant="outline">
                        Find Someone to Learn From <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage
                              src={request.to_profile?.avatar_url || "/placeholder.svg"}
                              alt={request.to_profile?.name}
                            />
                            <AvatarFallback>
                              {request.to_profile?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{request.to_profile?.name}</h4>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                                >
                                  {request.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span>
                                You offer: <Badge variant="secondary">{request.skill_offered}</Badge>
                              </span>
                              <span>
                                You want: <Badge variant="outline">{request.skill_wanted}</Badge>
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{request.message}</p>
                            <p className="text-xs text-gray-500">
                              Sent {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
