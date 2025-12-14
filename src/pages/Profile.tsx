import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Profile as ProfileType, Post } from '@/types/instagram';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Grid3X3, Settings, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      fetchFollowStats();
      if (user && !isOwnProfile) {
        checkIfFollowing();
      }
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setProfile(data as ProfileType);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, likes(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data as Post[]);
    }
  };

  const fetchFollowStats = async () => {
    const [followers, following] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
    ]);

    setFollowersCount(followers.count || 0);
    setFollowingCount(following.count || 0);
  };

  const checkIfFollowing = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) {
        toast.error('Failed to unfollow user');
      } else {
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
        toast.success('Unfollowed successfully');
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: userId });

      if (error) {
        toast.error('Failed to follow user');
      } else {
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success('Following!');
      }
    }

    setFollowLoading(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-4 text-center md:text-left">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-6">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-serif font-semibold mb-4">User not found</h2>
          <p className="text-muted-foreground">This profile doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <Avatar className="h-32 w-32 border-4 border-primary/30">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <h1 className="text-2xl font-semibold">{profile.username}</h1>
              
              {isOwnProfile ? (
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? 'outline' : 'gradient'}
                  size="sm"
                  className="rounded-xl"
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <p className="font-bold text-lg">{posts.length}</p>
                <p className="text-sm text-muted-foreground">posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{followersCount}</p>
                <p className="text-sm text-muted-foreground">followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{followingCount}</p>
                <p className="text-sm text-muted-foreground">following</p>
              </div>
            </div>

            {/* Bio */}
            {profile.full_name && (
              <p className="font-semibold">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="text-muted-foreground mt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Grid3X3 className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Posts</span>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-6 rounded-full bg-muted mb-4">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
              {isOwnProfile && (
                <p className="text-muted-foreground">
                  Share your first photo to get started!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="relative aspect-square group overflow-hidden rounded-lg"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-4 text-background font-semibold">
                      <span className="flex items-center gap-1">
                        ❤️ {post.likes?.length || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
