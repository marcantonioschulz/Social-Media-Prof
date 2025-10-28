import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '../hooks/usePosts';
import { useUploadAssets } from '../hooks/useAssets';
import Input from '../components/Input';
import Button from '../components/Button';
import FileUpload from '../components/FileUpload';
import type { Platform } from '../types';

const postSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen haben'),
  content: z.string().min(10, 'Inhalt muss mindestens 10 Zeichen haben'),
  scheduledAt: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const PostCreatePage = () => {
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const createPostMutation = useCreatePost();
  const uploadAssetsMutation = useUploadAssets();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  const platforms: Platform[] = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'];

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const onSubmit = async (data: PostFormData) => {
    if (selectedPlatforms.length === 0) {
      alert('Bitte wählen Sie mindestens eine Plattform aus');
      return;
    }

    try {
      // Upload assets first if any
      let assetIds: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadedAssets = await uploadAssetsMutation.mutateAsync(selectedFiles);
        assetIds = uploadedAssets.map((asset) => asset.id);
      }

      // Create post
      await createPostMutation.mutateAsync({
        title: data.title,
        content: data.content,
        platforms: selectedPlatforms,
        scheduledAt: data.scheduledAt || undefined,
        assetIds,
      });

      navigate('/posts');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Neuer Post</h1>
        <p className="text-gray-600">
          Erstellen Sie einen neuen Social Media Post
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Post Details</h2>

          <div className="space-y-4">
            <Input
              label="Titel"
              placeholder="Post Titel"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inhalt <span className="text-red-500">*</span>
              </label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Post Inhalt..."
                {...register('content')}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            <Input
              label="Geplante Veröffentlichung (optional)"
              type="datetime-local"
              helperText="Leer lassen für sofortige Veröffentlichung nach Genehmigung"
              {...register('scheduledAt')}
            />
          </div>
        </div>

        {/* Platform Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">
            Plattformen <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedPlatforms.includes(platform)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Assets (optional)</h2>
          <FileUpload
            onFilesSelected={setSelectedFiles}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
              'video/*': ['.mp4', '.webm', '.mov'],
              'audio/*': ['.mp3', '.wav', '.ogg'],
            }}
            maxFiles={10}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            isLoading={createPostMutation.isPending || uploadAssetsMutation.isPending}
          >
            Post erstellen
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/posts')}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostCreatePage;
