"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Clock, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

interface Profile {
  id: string
  name: string
  location?: string
  avatar_url?: string
  skills_offered: string[]
  skills_wanted: string[]
  availability: string
  is_public: boolean
  created_at: string
}

export default function HomePage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, profiles])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("is_public", true).limit(8)

      if (error) throw error
      setProfiles(data || [])
      setFilteredProfiles(data || [])
    } catch (error) {
      console.error("Error fetching profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === "") {
      setFilteredProfiles(profiles)
    } else {
      const filtered = profiles.filter(
        (profile) =>
          profile.skills_offered?.some((skill) => skill.toLowerCase().includes(term.toLowerCase())) ||
          profile.skills_wanted?.some((skill) => skill.toLowerCase().includes(term.toLowerCase())) ||
          profile.name.toLowerCase().includes(term.toLowerCase()),
      )
      setFilteredProfiles(filtered)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">SkillSwap</h1>
            </div>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline">My Profile</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Exchange Skills, Build Connections</h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect with others to share your expertise and learn new skills. Trade knowledge, grow together.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for skills like 'React', 'Photography', 'Excel'..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{profiles.length}</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {profiles.reduce((acc, profile) => acc + (profile.skills_offered?.length || 0), 0)}
              </div>
              <div className="text-gray-600">Skills Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">24</div>
              <div className="text-gray-600">Successful Swaps</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Profiles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              {searchTerm ? `Search Results (${filteredProfiles.length})` : "Featured Members"}
            </h3>
            <Link href="/browse">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                      <AvatarFallback>
                        {profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{profile.name}</CardTitle>
                      {profile.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{profile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Offers</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills_offered?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(profile.skills_offered?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(profile.skills_offered?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Wants</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.skills_wanted?.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(profile.skills_wanted?.length || 0) > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(profile.skills_wanted?.length || 0) - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{profile.availability}</span>
                  </div>

                  <Link href={`/profile/${profile.id}`}>
                    <Button className="w-full" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No users found matching your search.</div>
              <Button onClick={() => handleSearch("")} variant="outline">
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Swapping Skills?</h3>
          <p className="text-xl mb-8 text-blue-100">Join our community and start exchanging knowledge today.</p>
          <Link href={user ? "/profile/create" : "/auth/signup"}>
            <Button size="lg" variant="secondary">
              {user ? "Create Your Profile" : "Get Started"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
