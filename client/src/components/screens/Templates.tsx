import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Copy,
  MoreVertical,
  FileText,
  Loader2,
} from 'lucide-react';
import type { ListingTemplate, TemplateSourceType } from '../../types';

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
  onDuplicate: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onUse, onDelete, onDuplicate }) => {
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
                Tags: {template.tags?.join(', ') || 'None'}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              Used: {template.timesUsed || 0}x
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Category: {template.categoryName || 'Uncategorized'}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              Source: {sourceLabels[template.sourceType as TemplateSourceType] || 'Manual'}
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
                        onDuplicate(template.id!);
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
  const [sortBy, setSortBy] = useState('recent');
  const [templates, setTemplates] = useState<Partial<ListingTemplate>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/dashboard/templates?${params}`);
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, [sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/templates/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/templates/${id}/duplicate`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        loadTemplates(); // Reload to show new template
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const filteredTemplates = templates;

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
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Sort: Recent</option>
          <option value="used">Sort: Most Used</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={(id) => navigate(`/templates/${id}/edit`)}
              onUse={(id) => navigate(`/templates/${id}/use`)}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredTemplates.length === 0 && (
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

      {!isLoading && filteredTemplates.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {filteredTemplates.length} templates
        </p>
      )}
    </div>
  );
};
