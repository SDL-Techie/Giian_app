import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  FolderTree,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { Product, CreateProductPayload } from '../../types/product.types';
import { Category } from '../../types/category.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import './Products.css';

export const Products: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();

  const canCreate = hasPermission('products', 'create');
  const canModify = hasPermission('products', 'modify');
  const canReport = hasPermission('products', 'report');

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'report'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [reportProducts, setReportProducts] = useState<Product[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productErrors, setProductErrors] = useState<Record<string, string>>({});

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete/Deactivate Dialog
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getAllProducts(search, selectedCategoryFilter, statusFilter),
        categoryService.getAllCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategoryFilter, statusFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setItemCode('');
    setUnitOfMeasure('');
    setCategoryId(categories[0]?._id || '');
    setImageFile(null);
    setProductErrors({});
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductName(p.name);
    setItemCode(p.itemCode);
    setUnitOfMeasure(p.unitOfMeasure || '');
    const cat = typeof p.category === 'object' ? p.category._id : p.category;
    setCategoryId(cat);
    setImageFile(null);
    setProductErrors({});
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!productName.trim()) errs.name = 'Product name is required';
    if (!itemCode.trim()) errs.itemCode = 'Item code is required';
    if (!categoryId) errs.category = 'Category is required';

    if (Object.keys(errs).length > 0) {
      setProductErrors(errs);
      return;
    }

    setIsSavingProduct(true);
    try {
      const payload: CreateProductPayload = {
        name: productName,
        itemCode,
        unitOfMeasure: unitOfMeasure || undefined,
        category: categoryId,
        productImage: imageFile || undefined,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created successfully');
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    setIsSavingCategory(true);
    try {
      const cleanName = categoryName.trim();
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, { name: cleanName });
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory({ name: cleanName });
        toast.success('Category created successfully');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryName('');
      setCategoryError('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || (editingCategory ? 'Failed to update category' : 'Failed to create category'));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeactivateProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productService.deleteProduct(productToDelete._id);
      toast.success('Product deactivated successfully');
      setProductToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateProduct = async (product: Product) => {
    try { await productService.setProductStatus(product._id, 'Active'); toast.success('Product activated successfully'); loadData(); }
    catch (err:any) { toast.error(err.message || 'Failed to activate product'); }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete._id);
      toast.success('Category deleted successfully');
      setCategoryToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="products-page" id="products-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Categories</h1>
          <p className="page-subtitle">Product catalogue, categorization and inventory item codes</p>
        </div>
        {canCreate && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline"
              icon={<Plus size={16} />}
              onClick={openCreateCategory}
            >
              New Category
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={openCreateProduct}
              id="btn-create-product"
            >
              Create Product
            </Button>
          </div>
        )}
      </div>

      {activeTab !== 'report' && (
        <DataTransferBar
          module={activeTab === 'categories' ? 'categories' : 'products'}
          onImported={() => void loadData()}
        />
      )}

      <div className="page-tabs">
        <button
          className={`page-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} />
          <span>Product Catalogue</span>
        </button>
        <button
          className={`page-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderTree size={16} />
          <span>Categories</span>
        </button>
        {canReport && (
          <button
            className={`page-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={async () => { setActiveTab('report'); setIsReportLoading(true); try { setReportProducts(await productService.getProductListReport()); } catch (err: any) { toast.error(err.message || 'Failed to load product report'); } finally { setIsReportLoading(false); } }}
          >
            <FileSpreadsheet size={16} />
            <span>Product List Report</span>
          </button>
        )}
      </div>

      {activeTab === 'products' && (
        <Card>
          <div className="filter-bar">
            <div className="filter-search-box">
              <Input
                placeholder="Search by product name or item code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={16} />}
              />
            </div>
            <div className="filter-select-box">
              <Select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c._id, label: c.name })),
                ]}
              />
            </div>
            <div className="filter-select-box">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <Table
            data={products}
            isLoading={isLoading}
            keyExtractor={(p) => p._id}
            columns={[
              {
                header: 'Image',
                accessor: (p) =>
                  p.productImageUrl ? (
                    <img src={p.productImageUrl} alt={p.name} className="product-img-thumb" />
                  ) : (
                    <div className="product-img-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                      <ImageIcon size={16} />
                    </div>
                  ),
                width: '60px',
              },
              {
                header: 'Product Name',
                accessor: (p) => <strong>{p.name}</strong>,
              },
              {
                header: 'Item Code',
                accessor: (p) => <code style={{ backgroundColor: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '4px' }}>{p.itemCode}</code>,
              },
              {
                header: 'Category',
                accessor: (p) => (typeof p.category === 'object' ? p.category?.name : '-'),
              },
              {
                header: 'Unit of Measure',
                accessor: (p) => p.unitOfMeasure || '-',
              },
              {
                header: 'Status',
                accessor: (p) => (
                  <Badge variant={p.status === 'Active' ? 'success' : 'danger'}>
                    {p.status}
                  </Badge>
                ),
              },
              {
                header: 'Actions',
                accessor: (p) =>
                  canModify ? (
                    <div className="table-actions">
                      <button
                        className="action-icon-btn btn-edit"
                        onClick={() => openEditProduct(p)}
                        title="Edit Product"
                      >
                        <Edit2 size={16} />
                      </button>
                      {p.status === 'Inactive' ? (
                        <button className="action-icon-btn btn-edit" onClick={() => handleActivateProduct(p)} title="Activate Product">Activate</button>
                      ) : (
                        <button
                          className="action-icon-btn btn-delete"
                          onClick={() => setProductToDelete(p)}
                          title="Deactivate Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    '-'
                  ),
              },
            ]}
            emptyTitle="No products found"
            emptyDescription="Create your product inventory to use in purchases, quotations and sales."
          />
        </Card>
      )}

      {activeTab === 'categories' && (
        <Card title="Category Directory">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat) => (
              <div key={cat._id} className="category-hierarchy-item">
                <div>
                  <strong>{cat.name}</strong>

                </div>
                {canModify && (
                  <div className="table-actions">
                    <button
                      className="action-icon-btn btn-edit"
                      onClick={() => openEditCategory(cat)}
                      title="Edit Category"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-icon-btn btn-delete"
                      onClick={() => setCategoryToDelete(cat)}
                      title="Delete Category"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && !isLoading && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No categories created yet. Click "New Category" to organize your products.
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'report' && (
        <Card title="Full Product Catalogue Report">
          <Table
            data={reportProducts}
            isLoading={isReportLoading}
            keyExtractor={(p) => p._id}
            columns={[
              { header: 'Item Code', accessor: (p) => p.itemCode },
              { header: 'Product Name', accessor: (p) => <strong>{p.name}</strong> },
              { header: 'Category', accessor: (p) => (typeof p.category === 'object' ? p.category?.name : '-') },
              { header: 'Unit of Measure', accessor: (p) => p.unitOfMeasure || 'Units' },
              { header: 'Status', accessor: (p) => <Badge variant={p.status === 'Active' ? 'success' : 'danger'}>{p.status}</Badge> },
            ]}
            emptyTitle="No products in catalogue"
          />
        </Card>
      )}

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Modify Product' : 'Create Product'}
        size="md"
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Name of the Product"
            placeholder="e.g. Industrial Drill Machine"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            error={productErrors.name}
            isRequired
          />

          <div className="form-grid-2">
            <Input
              label="Item Code"
              placeholder="e.g. PRD-1001"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              error={productErrors.itemCode}
              isRequired
            />
            <Input
              label="Unit of Measure (optional)"
              placeholder="e.g. Pcs, Kg, Box, Ltr"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
            />
          </div>

          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={productErrors.category}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
            isRequired
          />

          <div className="input-group">
            <label className="input-label">Upload Product Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              className="input-field"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => setIsProductModalOpen(false)} disabled={isSavingProduct}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSavingProduct}
              loadingText={editingProduct ? 'Saving...' : 'Creating...'}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setCategoryError(''); }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Category Name"
            placeholder="e.g. Electronics, Heavy Tools"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            error={categoryError}
            isRequired
          />


          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" type="button" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setCategoryError(''); }} disabled={isSavingCategory}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSavingCategory}
              loadingText={editingCategory ? 'Saving...' : 'Creating...'}
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Product Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeactivateProduct}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${productToDelete?.name}"?`}
        confirmText="Deactivate"
        isLoading={isDeleting}
      />

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"?`}
        confirmText="Delete Category"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Products;
