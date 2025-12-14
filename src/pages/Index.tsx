import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/instagram';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user]);

  const fetchFeed = async () => {
    if (!user) return;

    setLoading(true);

    // Get the list of users the current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map((f) => f.following_id) || [];
    // Include own posts in feed
    const userIds = [...followingIds, user.id];

    if (userIds.length === 0) {
      // If not following anyone, show discover posts
      const { data: discoverPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(*),
          likes(*),
          comments(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      setPosts((discoverPosts as Post[]) || []);
    } else {
      const { data: feedPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(*),
          likes(*),
          comments(*)
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50);

      setPosts((feedPosts as Post[]) || []);
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Camera className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <div className="inline-flex p-6 rounded-full bg-muted">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-serif font-semibold">Your feed is empty</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Start following people to see their posts here, or create your first post!
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link to="/create">
                <Button variant="gradient">
                  <Camera className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeChange={fetchFeed} />
          ))
        )}
      </div>
    </Layout>
  );
}
