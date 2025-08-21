import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState({ name: '' });
  const [editingProduct, setEditingProduct] = useState<{ id: number; name: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleBarcodeClick = () => {};

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await api.getProducts();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        const updatedProduct = await api.updateProduct(editingProduct.id, formData);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        setEditingProduct(null);
      } else {
        const newProduct = await api.addProduct(formData);
        setProducts(prev => [...prev, newProduct]);
        setFormData({ name: '' });
      }
      toast.success('Product saved successfully');
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleEdit = (product: { id: number; name: string }) => {
    setEditingProduct(product);
    setFormData({ name: product.name });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure?')) {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} onBarcodeClick={handleBarcodeClick} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Products</h1>

            {/* Create/Edit form */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Product Name"
                  className="w-full sm:w-auto flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-t">
                      <td className="px-4 sm:px-6 py-3">{product.name}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800">Edit</button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;