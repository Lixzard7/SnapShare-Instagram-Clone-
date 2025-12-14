import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Post, Comment } from '@/types/instagram';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Heart, MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  useEffect(() => {
    if (post && user) {
      setIsLiked(post.likes?.some((like) => like.user_id === user.id) || false);
      setLikesCount(post.likes?.length || 0);
    }
  }, [post, user]);

  const fetchPost = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(*),
        likes(*)
      `)
      .eq('id', postId)
      .single();

    if (data) {
      setPost(data as Post);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as Comment[]);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        toast.error('Failed to unlike post');
      }
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);

      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
        toast.error('Failed to like post');
      }
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setCommentLoading(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select(`
        *,
        profiles:user_id(*)
      `)
      .single();

    if (error) {
      toast.error('Failed to add comment');
    } else if (data) {
      setComments((prev) => [...prev, data as Comment]);
      setNewComment('');
      toast.success('Comment added!');
    }

    setCommentLoading(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="aspect-square md:aspect-video rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!post) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-serif font-semibold mb-4">Post not found</h2>
          <p className="text-muted-foreground">This post doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>

        <div className="bg-card rounded-2xl overflow-hidden shadow-lg">
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div 
              className="relative aspect-square cursor-pointer"
              onDoubleClick={() => {
                if (!isLiked) handleLike();
                setIsLikeAnimating(true);
                setTimeout(() => setIsLikeAnimating(false), 300);
              }}
            >
              <img
                src={post.image_url}
                alt={post.caption || 'Post image'}
                className="w-full h-full object-cover"
              />
              
              {isLikeAnimating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart 
                    className={cn(
                      "h-24 w-24 text-primary-foreground drop-shadow-lg animate-heart",
                      isLiked ? "fill-primary" : ""
                    )}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Link to={`/profile/${post.user_id}`}>
                  <Avatar className="h-10 w-10 border-2 border-primary/30">
                    <AvatarImage src={post.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link 
                    to={`/profile/${post.user_id}`}
                    className="font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {post.profiles?.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Caption & Comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {post.caption && (
                  <div className="flex gap-3">
                    <Link to={`/profile/${post.user_id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <p className="text-sm">
                        <Link 
                          to={`/profile/${post.user_id}`}
                          className="font-semibold mr-2 hover:text-primary transition-colors"
                        >
                          {post.profiles?.username}
                        </Link>
                        {post.caption}
                      </p>
                    </div>
                  </div>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 animate-fade-in">
                    <Link to={`/profile/${comment.user_id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <p className="text-sm">
                        <Link 
                          to={`/profile/${comment.user_id}`}
                          className="font-semibold mr-2 hover:text-primary transition-colors"
                        >
                          {comment.profiles?.username}
                        </Link>
                        {comment.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={handleLike}
                  >
                    <Heart 
                      className={cn(
                        "h-6 w-6 transition-all",
                        isLiked ? "fill-primary text-primary" : ""
                      )}
                    />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                </div>

                <p className="font-semibold text-sm">
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </p>

                {/* Comment form */}
                <form onSubmit={handleComment} className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    disabled={!newComment.trim() || commentLoading}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
