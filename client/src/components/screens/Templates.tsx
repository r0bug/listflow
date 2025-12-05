import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Copy,
  MoreVertical,
  FileText,
} from 'lucide-react';
import type { ListingTemplate, TemplateSourceType } from '../../types';

// Mock data
const mockTemplates: Partial<ListingTemplate>[] = [
  {
    id: '1',
    name: 'PS5 Console Template',
    tags: ['gaming', 'console', 'sony'],
    categoryName: 'Video Games > Consoles',
    sourceType: 'SELL_SIMILAR',
    sourceEbayItemId: '123456789',
    timesUsed: 47,
    isActive: true,
  },
  {
    id: '2',
    name: 'iPhone 14 Pro Template',
    tags: ['phone', 'apple', 'iphone'],
    categoryName: 'Cell Phones & Smartphones',
    sourceType: 'MANUAL',
    timesUsed: 32,
    isActive: true,
  },
  {
    id: '3',
    name: 'Vinyl Record Template',
    tags: ['vinyl', 'records', 'music'],
    categoryName: 'Music > Records',
    sourceType: 'MANUAL',
    timesUsed: 89,
    isActive: true,
  },
  {
    id: '4',
    name: 'Nintendo Switch Game Template',
    tags: ['gaming', 'nintendo', 'switch'],
    categoryName: 'Video Games > Games',
    sourceType: 'AI_GENERATED',
    timesUsed: 156,
    isActive: true,
  },
];

const sourceLabels: Record<TemplateSourceType, string> = {
  MANUAL: 'Manual',
  SELL_SIMILAR: 'Sell Similar',
  AI_GENERATED: 'AI Generated',
  IMPORTED: 'Imported',
};

interface TemplateCardProps {
  template: Partial<ListingTemplate>;
  onEdit: (id: string) => void;
  onUse: (id: string) => void;
  onDelete: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onUse, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText size={24} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tags: {template.tags?.join(', ')}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              Used: {template.timesUsed}x
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Category: {template.categoryName}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              Source: {sourceLabels[template.sourceType as TemplateSourceType]}
              {template.sourceEbayItemId && ` (eBay #${template.sourceEbayItemId})`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(template.id!)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => onUse(template.id!)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        // Duplicate logic
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <Copy size={14} />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(template.id!);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredTemplates = mockTemplates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name?.toLowerCase().includes(query) ||
        template.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <button
          onClick={() => navigate('/templates/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="gaming">Gaming</option>
          <option value="phones">Phones</option>
          <option value="music">Music</option>
        </select>
        <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="recent">Sort: Recent</option>
          <option value="used">Sort: Most Used</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={(id) => navigate(`/templates/${id}/edit`)}
            onUse={(id) => navigate(`/templates/${id}/use`)}
            onDelete={(id) => {
              // Delete logic
              console.log('Delete template:', id);
            }}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            Create your first template to speed up listing similar items.
          </p>
          <button
            onClick={() => navigate('/templates/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Template
          </button>
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        Showing {filteredTemplates.length} of {mockTemplates.length} templates
      </p>
    </div>
  );
};
