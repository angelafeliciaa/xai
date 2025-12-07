'use client';

import { useState } from 'react';

interface ProductModalProps {
  onClose: () => void;
  onSave: (product: any) => void;
}

export default function ProductModal({ onClose, onSave }: ProductModalProps) {
  const [productType, setProductType] = useState<'digital' | 'physical'>('physical');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    price: '',
  });

  const handleSubmit = () => {
    if (!formData.name) return;
    
    onSave({
      ...formData,
      type: productType,
      price: parseFloat(formData.price) || 0,
    });
  };

  const isValid = formData.name && formData.description;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
              <p className="text-sm text-gray-600">Edit your product details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span>📦</span>
              Product Type
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setProductType('digital')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  productType === 'digital'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-white border-2 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    productType === 'digital' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    <span className="text-xl">📥</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Digital
                      {productType === 'digital' && (
                        <span className="text-blue-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      A digital product that customers can download or access, such as a software program, app, website, etc.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setProductType('physical')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  productType === 'physical'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white border-2 border-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🛒</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Physical
                      {productType === 'physical' && (
                        <span className="text-green-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      A tangible product that you can ship or be picked up, such as a book, DVD, etc.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>T</span>
              Product Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Product URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>🌐</span>
              Product URL
              <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://yourshop.com/product/123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>📝</span>
              Product Description
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add additional product details. If it is a digital product, add any access instructions."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>

          {/* Retail Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retail Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isValid
                ? 'bg-black text-white hover:bg-gray-900'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isValid ? (
              <>
                <span>✓</span> Save Product
              </>
            ) : (
              <>
                <span>ⓘ</span> Complete Required Fields
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

