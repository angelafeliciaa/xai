'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProductModal from './components/ProductModal';

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Your Products</h1>
              <p className="text-gray-600">Manage your product catalog for campaigns</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <span>+</span> Add New Product
            </button>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📦</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">No products yet</h2>
                <p className="text-gray-600 mb-6">
                  Add products to feature in your campaigns and showcase to creators
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  <span>+</span> Add New Product
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        ${product.price}
                      </span>
                      <button className="text-sm text-gray-600 hover:text-gray-900">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          onClose={() => setIsModalOpen(false)}
          onSave={(product) => {
            setProducts([...products, { ...product, id: Date.now() }]);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

