import { useState } from 'react';
import { PlusIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useAssets, useDeleteAsset, useUploadAssets } from '../hooks/useAssets';
import AssetCard from '../components/AssetCard';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import type { AssetFilters } from '../types';

const AssetsPage = () => {
  const [filters, setFilters] = useState<AssetFilters>({});
  const [page, setPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const { data, isLoading } = useAssets(filters, { page, limit: 12 });
  const deleteAssetMutation = useDeleteAsset();
  const uploadAssetsMutation = useUploadAssets();

  const handleDelete = (id: string) => {
    deleteAssetMutation.mutate(id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
    setPage(1);
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      assetType: e.target.value as any,
    });
    setPage(1);
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) {
      return;
    }

    try {
      await uploadAssetsMutation.mutateAsync(filesToUpload);
      setIsUploadModalOpen(false);
      setFilesToUpload([]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Asset-Bibliothek</h1>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Assets hochladen
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Assets durchsuchen..."
            value={filters.search || ''}
            onChange={handleSearch}
          />

          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.assetType || ''}
            onChange={handleTypeFilter}
          >
            <option value="">Alle Typen</option>
            <option value="image">Bilder</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="text">Text</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.data.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Zurück
              </Button>
              <span className="text-sm text-gray-600">
                Seite {page} von {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CloudArrowUpIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Keine Assets vorhanden</p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Erste Assets hochladen
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setFilesToUpload([]);
        }}
        title="Assets hochladen"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsUploadModalOpen(false);
                setFilesToUpload([]);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={uploadAssetsMutation.isPending}
              disabled={filesToUpload.length === 0}
            >
              {filesToUpload.length > 0
                ? `${filesToUpload.length} Datei(en) hochladen`
                : 'Hochladen'}
            </Button>
          </>
        }
      >
        <FileUpload
          onFilesSelected={setFilesToUpload}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov'],
            'audio/*': ['.mp3', '.wav', '.ogg'],
            'text/*': ['.txt', '.md'],
          }}
          maxFiles={20}
        />
      </Modal>
    </div>
  );
};

export default AssetsPage;
