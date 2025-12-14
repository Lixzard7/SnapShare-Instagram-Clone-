import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Post, Like } from '@/types/instagram';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  onLikeChange?: () => void;
}

export default function PostCard({ post, onLikeChange }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like.user_id === user?.id) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

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
        .eq('post_id', post.id)
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
        .insert({ post_id: post.id, user_id: user.id });

      if (error) {
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
        toast.error('Failed to like post');
      }
    }

    onLikeChange?.();
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      handleLike();
    } else {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 300);
    }
  };

  return (
    <article className="bg-card rounded-2xl overflow-hidden shadow-md animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link 
          to={`/profile/${post.user_id}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/30 group-hover:border-primary transition-colors">
            <AvatarImage src={post.profiles?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
              {post.profiles?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </Link>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Image */}
      <div 
        className="relative aspect-square cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={post.image_url}
          alt={post.caption || 'Post image'}
          className="w-full h-full object-cover"
        />
        
        {/* Heart animation overlay */}
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

      {/* Actions */}
      <div className="p-4 space-y-3">
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
                isLiked ? "fill-primary text-primary scale-110" : "hover:scale-110"
              )}
            />
          </Button>
          
          <Link to={`/post/${post.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle className="h-6 w-6 hover:scale-110 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <Link 
              to={`/profile/${post.user_id}`}
              className="font-semibold hover:text-primary transition-colors mr-2"
            >
              {post.profiles?.username}
            </Link>
            {post.caption}
          </p>
        )}

        {/* Comments preview */}
        {post.comments && post.comments.length > 0 && (
          <Link 
            to={`/post/${post.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {post.comments.length} comments
          </Link>
        )}
      </div>
    </article>
  );
}
