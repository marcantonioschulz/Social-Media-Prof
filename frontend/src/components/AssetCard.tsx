import { useState } from 'react';
import {
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Asset } from '../types';
import { formatFileSize, formatDateTime, isImageFile, isVideoFile, isAudioFile } from '../lib/utils';
import Button from './Button';
import Modal from './Modal';

interface AssetCardProps {
  asset: Asset;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (asset: Asset) => void;
}

const AssetCard = ({ asset, onDelete, selectable, selected, onSelect }: AssetCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getAssetIcon = () => {
    if (isImageFile(asset.fileName)) {
      return <PhotoIcon className="h-8 w-8" />;
    }
    if (isVideoFile(asset.fileName)) {
      return <VideoCameraIcon className="h-8 w-8" />;
    }
    if (isAudioFile(asset.fileName)) {
      return <MusicalNoteIcon className="h-8 w-8" />;
    }
    return <DocumentTextIcon className="h-8 w-8" />;
  };

  const renderPreview = () => {
    if (asset.assetType === 'image' && asset.url) {
      return (
        <img
          src={asset.thumbnailUrl || asset.url}
          alt={asset.originalFileName}
          className="w-full h-48 object-cover"
        />
      );
    }
    if (asset.assetType === 'video' && asset.thumbnailUrl) {
      return (
        <div className="relative">
          <img
            src={asset.thumbnailUrl}
            alt={asset.originalFileName}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <VideoCameraIcon className="h-12 w-12 text-white" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
        {getAssetIcon()}
      </div>
    );
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden ${
          selectable ? 'cursor-pointer' : ''
        } ${selected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => selectable && onSelect && onSelect(asset)}
      >
        {renderPreview()}

        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 truncate mb-2">
            {asset.originalFileName}
          </h3>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{asset.assetType}</span>
            <span>{formatFileSize(asset.fileSize)}</span>
          </div>

          {asset.licenseInfo && (
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {asset.licenseInfo.type}
              </span>
            </div>
          )}

          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {asset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{asset.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              Details
            </Button>
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Asset wirklich löschen?')) {
                    onDelete(asset.id);
                  }
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Asset Details"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Dateiname</label>
            <p className="text-gray-900">{asset.originalFileName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Typ</label>
            <p className="text-gray-900">{asset.assetType}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Größe</label>
            <p className="text-gray-900">{formatFileSize(asset.fileSize)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Hochgeladen am</label>
            <p className="text-gray-900">{formatDateTime(asset.createdAt)}</p>
          </div>
          {asset.licenseInfo && (
            <div>
              <label className="text-sm font-medium text-gray-700">Lizenzinformationen</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Typ:</strong> {asset.licenseInfo.type}
                </p>
                {asset.licenseInfo.source && (
                  <p className="text-sm">
                    <strong>Quelle:</strong> {asset.licenseInfo.source}
                  </p>
                )}
                {asset.licenseInfo.author && (
                  <p className="text-sm">
                    <strong>Autor:</strong> {asset.licenseInfo.author}
                  </p>
                )}
                {asset.licenseInfo.restrictions && (
                  <p className="text-sm">
                    <strong>Einschränkungen:</strong> {asset.licenseInfo.restrictions}
                  </p>
                )}
              </div>
            </div>
          )}
          {asset.url && (
            <div>
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Asset öffnen
              </a>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AssetCard;
