
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { DialogClose } from "@/components/ui/dialog";

interface AddVideoFormProps {
  onSuccess: () => void;
}

interface FormData {
  url: string;
}

const extractVideoId = (url: string): string | null => {
  // Handle youtube.com URLs
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
  const match = url.match(youtubeRegex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // If the input is already a video ID (11 characters), return it
  if (/^[\w-]{11}$/.test(url)) {
    return url;
  }
  
  return null;
};

const AddVideoForm = ({ onSuccess }: AddVideoFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const videoId = extractVideoId(data.url);

    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL or video ID",
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
          {...register("url", { required: "YouTube URL is required" })}
          placeholder="Enter YouTube URL or video ID"
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
