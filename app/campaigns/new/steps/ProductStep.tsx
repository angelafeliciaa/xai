'use client';

import { useState } from 'react';
import ProductModal from '../../../products/components/ProductModal';

interface ProductStepProps {
  data: any;
  updateData: (data: any) => void;
}

export default function ProductStep({ data, updateData }: ProductStepProps) {
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const handleSaveProduct = (product: any) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts([...products, newProduct]);
    setShowModal(false);
    // Auto-select the newly added product
    updateData({ product: newProduct.id.toString() });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Details</h2>
        <p className="text-sm text-gray-600">Select the product for this campaign</p>
      </div>

      <div className="space-y-6">
        {/* Product Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Product <span className="text-red-500">*</span>
            </label>
            <button 
              onClick={() => setShowModal(true)}
              type="button"
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <span>+</span> Add Product
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <span className="text-3xl">📦</span>
            </div>
            <div className="flex-1">
              <select
                value={data.product}
                onChange={(e) => updateData({ product: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id.toString()}>
                    {product.name} - ${product.price}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Delivery
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select the option that best describes the product delivery for this campaign.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={data.shippingRequired}
                onChange={(e) => updateData({ shippingRequired: e.target.checked })}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Product will need to be shipped</p>
                <p className="text-xs text-gray-600 mt-1">
                  Creator must have a valid shipment address in their profile in order for a product to be sent.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={!data.shippingRequired}
                onChange={(e) => updateData({ shippingRequired: false })}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">No shipping required</p>
                <p className="text-xs text-gray-600 mt-1">
                  Product is digital or does not require physical delivery.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Retail Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Retail Price
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Incentivize creators to apply by displaying the retail value of the product in your campaign. 
            If it's multiple products, please provide the cumulative retail price.
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={data.retailPrice}
              onChange={(e) => updateData({ retailPrice: e.target.value })}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              step="0.01"
            />
          </div>
        </div>

        {/* Additional Product Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Description (Optional)
          </label>
          <textarea
            value={data.productDescription || ''}
            onChange={(e) => updateData({ productDescription: e.target.value })}
            placeholder="Describe the product and what makes it special..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

