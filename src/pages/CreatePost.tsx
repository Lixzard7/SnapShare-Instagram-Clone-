import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, ImagePlus, X } from 'lucide-react';
import { z } from 'zod';

const postSchema = z.object({
  imageUrl: z.string().url('Please enter a valid image URL'),
  caption: z.string().max(2200, 'Caption is too long').optional(),
});

export default function CreatePost() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = postSchema.safeParse({ imageUrl, caption });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      image_url: imageUrl,
      caption: caption || null,
    });

    if (error) {
      toast.error('Failed to create post');
      setLoading(false);
      return;
    }

    toast.success('Post created successfully!');
    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-serif flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <ImagePlus className="h-5 w-5 text-primary-foreground" />
              </div>
              Create New Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Preview */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewError(false);
                  }}
                  className="h-12"
                />
                
                {imageUrl && (
                  <div className="relative mt-4 rounded-xl overflow-hidden bg-muted aspect-square">
                    {!previewError ? (
                      <>
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setPreviewError(true)}
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-3 right-3 p-2 rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">Unable to load image</p>
                      </div>
                    )}
                  </div>
                )}
                
                {!imageUrl && (
                  <div className="mt-4 rounded-xl border-2 border-dashed border-border aspect-square flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="inline-flex p-4 rounded-full bg-muted">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter an image URL to preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {caption.length}/2200
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={loading || !imageUrl}
              >
                {loading ? 'Creating...' : 'Share Post'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
