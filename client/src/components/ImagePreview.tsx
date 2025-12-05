import React from 'react';
import { CheckCircle, Info, Loader2 } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  analysis?: any;
  isAnalyzing: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  analysis,
  isAnalyzing
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt="Uploaded item" 
          className="w-full h-64 object-contain bg-gray-50"
        />
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Analyzing image...</p>
            </div>
          </div>
        )}
      </div>
      
      {analysis && !isAnalyzing && (
        <div className="p-4 space-y-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Image Analysis Complete</h3>
              <p className="text-sm text-gray-600 mt-1">
                AI has identified the following details:
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-md p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Item Type:</span>
              <span className="text-sm text-gray-900">{analysis.itemType}</span>
            </div>
            {analysis.brand && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Brand:</span>
                <span className="text-sm text-gray-900">{analysis.brand}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Condition:</span>
              <span className="text-sm text-gray-900">{analysis.condition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Est. Value:</span>
              <span className="text-sm text-gray-900">{analysis.estimatedValue}</span>
            </div>
            {analysis.category && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Category:</span>
                <span className="text-sm text-gray-900">{analysis.category}</span>
              </div>
            )}
          </div>
          
          {analysis.features && analysis.features.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Key Features:</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.features.map((feature: string, index: number) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-2 pt-2 border-t">
            <Info className="h-4 w-4 text-blue-500 mt-0.5" />
            <p className="text-xs text-gray-600">
              Review and edit the generated listing details before posting to eBay
            </p>
          </div>
        </div>
      )}
    </div>
  );
};