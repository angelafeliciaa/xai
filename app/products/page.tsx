'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProductModal from './components/ProductModal';

export default function Products() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const handleSaveProduct = (product: any) => {
    setProducts([...products, { ...product, id: Date.now() }]);
    setShowAddProduct(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Products</h1>
              <p className="text-gray-600">Manage your product catalog for campaigns</p>
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <span>+</span> Add Product
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Add New Product Card */}
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-white rounded-xl p-8 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all flex flex-col items-center justify-center min-h-[280px] group"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Add New Product</h3>
              <p className="text-sm text-gray-500">Upload product details</p>
            </button>

            {/* Product Cards */}
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{product.type === 'digital' ? '📥' : '🛒'}</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {product.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.url && (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <ProductModal
          onClose={() => setShowAddProduct(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}
