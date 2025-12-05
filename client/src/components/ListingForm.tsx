import React, { useState } from 'react';
import { Send, DollarSign, Package, Tag } from 'lucide-react';

interface ListingData {
  title: string;
  description: string;
  category: string;
  condition: string;
  startingPrice: number;
  buyNowPrice: number;
  shippingCost: number;
  tags: string[];
}

interface ListingFormProps {
  initialData?: Partial<ListingData>;
  onSubmit: (data: ListingData) => void;
  isSubmitting: boolean;
}

export const ListingForm: React.FC<ListingFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<ListingData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    condition: initialData?.condition || 'used-good',
    startingPrice: initialData?.startingPrice || 0,
    buyNowPrice: initialData?.buyNowPrice || 0,
    shippingCost: initialData?.shippingCost || 0,
    tags: initialData?.tags || []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Price') || name === 'shippingCost' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Listing Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a descriptive title (max 80 characters)"
          maxLength={80}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.title.length}/80 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
          placeholder="Describe your item in detail..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="inline w-4 h-4 mr-1" />
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            <option value="58058">Computers & Networking</option>
            <option value="293">Consumer Electronics</option>
            <option value="11232">Clothing & Accessories</option>
            <option value="11700">Home & Garden</option>
            <option value="220">Toys & Hobbies</option>
            <option value="6000">Business & Industrial</option>
            <option value="267">Books & Magazines</option>
            <option value="11233">Music & Movies</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="new">New</option>
            <option value="new-other">New Other</option>
            <option value="refurbished">Refurbished</option>
            <option value="used-like-new">Used - Like New</option>
            <option value="used-very-good">Used - Very Good</option>
            <option value="used-good">Used - Good</option>
            <option value="used-acceptable">Used - Acceptable</option>
            <option value="for-parts">For Parts/Not Working</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            Starting Price
          </label>
          <input
            type="number"
            name="startingPrice"
            value={formData.startingPrice}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            Buy Now Price
          </label>
          <input
            type="number"
            name="buyNowPrice"
            value={formData.buyNowPrice}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Cost
          </label>
          <input
            type="number"
            name="shippingCost"
            value={formData.shippingCost}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tag className="inline w-4 h-4 mr-1" />
          Search Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add tags for better visibility"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2
          ${isSubmitting 
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'}
          transition-colors duration-200
        `}
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Creating Listing...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Create eBay Listing
          </>
        )}
      </button>
    </form>
  );
};