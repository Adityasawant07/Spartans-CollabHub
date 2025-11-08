export interface StudentProfile {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  profile_picture_url?: string
  college?: string
  branch?: string
  year?: number
  skills?: string[]
  interests?: string[]
  bio?: string
  github?: string
  linkedin?: string
  portfolio?: string
  past_projects?: PastProject[]
  achievements?: Achievement[]
  avatar_url?: string
  skill_points?: number
  privacy_settings?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PastProject {
  title: string
  description: string
  url?: string
  role?: string
  year?: number
}

export interface Achievement {
  title: string
  description: string
  year?: number
}

export interface Project {
  id: string
  title: string
  description: string
  tags?: string[]
  required_skills?: string[]
  status: "Open" | "Closed" | "In Progress"
  author_id: string
  team?: TeamMember[]
  applicants?: Applicant[]
  attachments?: Attachment[]
  resources?: Resource[]
  category?: string
  team_size?: number
  difficulty?: "easy" | "medium" | "hard"
  accepted_count?: number
  is_active?: boolean
  created_at: string
  updated_at: string
  author?: StudentProfile
}

export interface TeamMember {
  user: string
  role: string
  joined_at: string
}

export interface Applicant {
  user: string
  message: string
  status: "Pending" | "Accepted" | "Rejected" | "Approved"
}

export interface ApplicantWithProfile extends Applicant {
  profile?: StudentProfile
}

export interface Attachment {
  name: string
  url: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  read: boolean
  created_at: string
  sender?: StudentProfile
  recipient?: StudentProfile
}

export interface Conversation {
  other_user: StudentProfile
  last_message: Message
  unread_count: number
}

export interface Event {
  id: string
  name: string
  description: string | null
  date: string
  location: string | null
  banner_url?: string | null
  organizer_id: string
  organizer?: StudentProfile
  created_at: string
  updated_at: string
}

export interface Recommendation {
  project: Project
  matchScore: number
  matchedSkills: string[]
  reason: string
}

export interface UserAchievement {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string | null
  image_url: string | null
  created_at: string
}

export interface UserProject {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string | null
  banner_url: string | null
  link: string | null
  created_at: string
}

export interface Competition {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  banner_url: string | null
  organizer_id: string
  organizer?: StudentProfile
  upvotes?: number
  created_at: string
}

export interface Organizer {
  id: string
  institute_name: string
  institute_code: string
  email: string
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  icon: string | null
  skill_points: number
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface Resource {
  name: string
  url: string
  type?: string
}

export interface LeaderboardEntry {
  profile: StudentProfile
  skill_points: number
  badges: Badge[]
  rank: number
}

export interface GroupChat {
  id: string
  task_id: string
  name: string
  members: string[]
  created_by: string
  created_at: string
}

export interface GroupMessage {
  id: string
  group_chat_id: string
  sender_id: string
  message: string
  created_at: string
  sender?: StudentProfile
}
