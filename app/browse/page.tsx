"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Clock, Users, Filter, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

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

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, locationFilter, availabilityFilter, sortBy, profiles])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error("Error fetching profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    const filtered = profiles.filter((profile) => {
      const matchesSearch =
        searchTerm === "" ||
        profile.skills_offered?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        profile.skills_wanted?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        profile.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocation =
        locationFilter === "" ||
        (profile.location && profile.location.toLowerCase().includes(locationFilter.toLowerCase()))

      const matchesAvailability =
        availabilityFilter === "all" || profile.availability.toLowerCase() === availabilityFilter.toLowerCase()

      return matchesSearch && matchesLocation && matchesAvailability
    })

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "skills":
          return (b.skills_offered?.length || 0) - (a.skills_offered?.length || 0)
        default:
          return 0
      }
    })

    setFilteredProfiles(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setLocationFilter("")
    setAvailabilityFilter("all")
    setSortBy("newest")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading members...</p>
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
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Browse Members</h1>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>Find members with the skills you're looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search skills or names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Location Filter */}
              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />

              {/* Availability Filter */}
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Availability</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                  <SelectItem value="evenings">Evenings</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="by-appointment">By Appointment</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Members</SelectItem>
                  <SelectItem value="oldest">Oldest Members</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="skills">Most Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredProfiles.length} of {profiles.length} members
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
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
                    {(!profile.skills_offered || profile.skills_offered.length === 0) && (
                      <span className="text-xs text-gray-500">No skills listed</span>
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
                    {(!profile.skills_wanted || profile.skills_wanted.length === 0) && (
                      <span className="text-xs text-gray-500">No skills listed</span>
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
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or clearing the filters.</p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
