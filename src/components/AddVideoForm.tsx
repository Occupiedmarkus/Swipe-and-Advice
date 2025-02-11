
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { DialogClose } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface AddVideoFormProps {
  onSuccess: () => void;
}

interface FormData {
  url: string;
}

const extractVideoId = (url: string): string | null => {
  // Handle youtube.com URLs
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
  const youtubeMatch = url.match(youtubeRegex);
  
  if (youtubeMatch && youtubeMatch[1]) {
    return `youtube:${youtubeMatch[1]}`;
  }
  
  // Handle Vimeo URLs
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  
  if (vimeoMatch && vimeoMatch[1]) {
    return `vimeo:${vimeoMatch[1]}`;
  }
  
  // Handle Dailymotion URLs
  const dailymotionRegex = /(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/;
  const dailymotionMatch = url.match(dailymotionRegex);
  
  if (dailymotionMatch && dailymotionMatch[1]) {
    return `dailymotion:${dailymotionMatch[1]}`;
  }
  
  // If the input is already a video ID with platform prefix (e.g., "youtube:abc123")
  if (/^(youtube|vimeo|dailymotion):[\w-]+$/.test(url)) {
    return url;
  }
  
  return null;
};

const AddVideoForm = ({ onSuccess }: AddVideoFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const videoId = extractVideoId(data.url);

    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add videos",
        variant: "destructive",
      });
      setIsLoading(false);
      navigate("/auth");
      return;
    }

    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL from YouTube, Vimeo, or Dailymotion",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('videos')
      .insert([
        {
          video_id: videoId,
          category: 'general',
          created_at: new Date().toISOString(),
          user_id: session.data.session.user.id
        }
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add video. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Video added successfully!",
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Input
          {...register("url", { required: "Video URL is required" })}
          placeholder="Enter YouTube, Vimeo, or Dailymotion URL"
          className="bg-zinc-800 border-zinc-700 text-white"
        />
        {errors.url && (
          <p className="text-sm text-red-500">{errors.url.message}</p>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <DialogClose asChild>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Video"}
        </Button>
      </div>
    </form>
  );
};

export default AddVideoForm;
