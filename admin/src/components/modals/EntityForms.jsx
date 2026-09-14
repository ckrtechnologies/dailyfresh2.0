import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Save, X, Image as ImageIcon, Link as LinkIcon, Upload, Tag, Layers, Package, User, Store as StoreIcon, Shield, FileText, Plus, Trash2, Info, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleMapPicker from '../common/GoogleMapPicker';

// Common Components
const Input = ({ label, value, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <input
      style={{
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
        background: 'white',
        transition: 'border-color 0.2s',
        width: '100%'
      }}
      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      value={value ?? ''}
      {...props}
    />
  </div>
);

const Select = ({ label, options = [], value, placeholder, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    <select
      style={{
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        fontSize: '14px',
        background: 'white',
        outline: 'none',
        cursor: 'pointer',
        width: '100%'
      }}
      value={value ?? ''}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {(options || []).map(opt => <option key={opt.id} value={opt.id}>{opt.name || opt.title || opt.id}</option>)}
    </select>
  </div>
);

const FormWrapper = ({ title, onClose, onSubmit, loading, children, tabs = [], activeTab, onTabChange, initialData }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000 }}>
    <div className="glass-panel animate-slide-in-right" style={{ width: '100%', maxWidth: '900px', height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '-10px 0 50px -12px rgba(0, 0, 0, 0.5)', background: 'white', borderRadius: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Configure entity details and settings</p>
        </div>
        <button onClick={onClose} className="btn-icon" style={{ background: '#f1f5f9' }}><X size={20} /></button>
      </div>

      {/* Tabs Navigation */}
      {tabs.length > 0 && (activeTab && onTabChange) && (
        <div style={{ padding: '0 24px', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', gap: '24px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '14px 0',
                fontSize: '13px',
                fontWeight: '600',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                border: 'none',
                background: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {tab.icon && <tab.icon size={14} />}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', height: '450px', overflowY: 'auto' }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          background: 'white',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-compact"
            style={{
              minWidth: '100px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button
            disabled={loading}
            type="submit"
            className="btn-compact"
            style={{
              minWidth: '140px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '600',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Processing...' : (initialData ? 'Save Changes' : 'Create Entity')}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const DrawerWrapper = ({ title, onClose, onSubmit, loading, children, tabs = [], activeTab, onTabChange, initialData }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 1000
  }}>
    <div style={{
      width: '100%',
      maxWidth: '960px',
      height: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Configure product inventory, pricing, marketing and variant options</p>
        </div>
        <button onClick={onClose} className="btn-icon" style={{ background: '#f1f5f9' }}><X size={20} /></button>
      </div>

      {/* Drawer Body with Left Vertical Tabs & Right Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {tabs.length > 0 && (
          <div style={{
            width: '210px',
            background: 'white',
            borderRight: '1px solid var(--border)',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexShrink: 0,
            overflowY: 'auto'
          }}>
            {tabs.map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                    background: isActive ? '#f0fdf4' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {IconComp && <IconComp size={16} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={{
        padding: '16px 24px',
        background: 'white',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        flexShrink: 0
      }}>
        <button
          type="button"
          onClick={onClose}
          className="btn-compact"
          style={{ minWidth: '100px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '600' }}
        >
          Cancel
        </button>
        <button
          disabled={loading}
          type="button"
          onClick={onSubmit}
          className="btn-compact"
          style={{
            minWidth: '150px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Product')}
        </button>
      </div>
    </div>
  </div>
);

const ImageInput = ({ label, value, onChange, onFileChange, imageFile }) => {
  const [mode, setMode] = useState(value && !imageFile ? 'url' : 'upload');
  const [preview, setPreview] = useState(value || null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileChange(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => setMode('upload')} style={{ fontSize: '10px', color: mode === 'upload' ? 'var(--primary)' : 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Upload size={10} /> Upload
          </button>
          <button type="button" onClick={() => setMode('url')} style={{ fontSize: '10px', color: mode === 'url' ? 'var(--primary)' : 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <LinkIcon size={10} /> URL
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#f1f5f9', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={16} color="#94a3b8" />}
        </div>

        <div style={{ flex: 1 }}>
          {mode === 'url' ? (
            <input
              className="form-control"
              style={{ fontSize: '12px', padding: '6px 10px' }}
              value={value || ''}
              onChange={(e) => { onChange(e.target.value); setPreview(e.target.value); onFileChange(null); }}
              placeholder="https://example.com/image.jpg"
            />
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
              <div style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px', color: imageFile ? 'var(--text-main)' : 'var(--text-muted)', background: 'white' }}>
                {imageFile ? imageFile.name : 'Choose image...'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SubCategoryForm = ({ initialData, onSave, onClose, loading, categories = [] }) => {
  const [formData, setFormData] = useState(initialData || { name: '', slug: '', description: '', category_id: categories[0]?.id || '', display_order: 0 });
  const [activeTab, setActiveTab] = useState('general');

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, name, slug });
  };

  const tabs = [
    { id: 'general', label: 'General Details', icon: Layers },
    { id: 'media', label: 'Visuals', icon: ImageIcon }
  ];

  return (
    <FormWrapper
      title={`${initialData ? 'Edit' : 'Add'} Sub-Category`}
      onClose={onClose}
      onSubmit={(e) => { 
        e.preventDefault(); 
        const catId = formData.category_id || formData.categoryId;
        const cleaned = {
          ...formData,
          category_id: catId,
          categoryId: catId
        };
        delete cleaned.category;
        delete cleaned.createdAt;
        delete cleaned.updatedAt;
        onSave(cleaned); 
      }}
      loading={loading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      initialData={initialData}
    >
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select 
              label="Parent Category" 
              value={formData.category_id || formData.categoryId || ''} 
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value, categoryId: e.target.value })} 
              options={categories} 
            />
            <Input label="Sub-Category Name" value={formData.name} onChange={handleNameChange} required />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-control"
              style={{ resize: 'none', minHeight: '124px' }}
              rows={5}
              placeholder="Describe this sub-category..."
            />
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div style={{ maxWidth: '500px' }}>
          <ImageInput
            label="Sub-Category Visual"
            value={formData.image_url}
            imageFile={formData.imageFile}
            onChange={(url) => setFormData({ ...formData, image_url: url, imageFile: null })}
            onFileChange={(file) => setFormData({ ...formData, imageFile: file, image_url: '' })}
          />
        </div>
      )}
    </FormWrapper>
  );
};

export const CategoryForm = ({ initialData, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState(initialData || { name: '', slug: '', description: '', display_order: 0 });
  const [activeTab, setActiveTab] = useState('general');

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, name, slug });
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: Tag },
    { id: 'media', label: 'Visuals', icon: ImageIcon }
  ];

  return (
    <FormWrapper
      title={`${initialData ? 'Edit' : 'Add'} Category`}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
      loading={loading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      initialData={initialData}
    >
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Category Name" value={formData.name} onChange={handleNameChange} required />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
            <Input label="Display Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-control"
                style={{ resize: 'none', minHeight: '124px' }}
                rows={5}
                placeholder="Brief description of the category..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div style={{ maxWidth: '500px' }}>
          <ImageInput
            label="Category Banner / Thumbnail"
            value={formData.image_url}
            imageFile={formData.imageFile}
            onChange={(url) => setFormData({ ...formData, image_url: url, imageFile: null })}
            onFileChange={(file) => setFormData({ ...formData, imageFile: file, image_url: '' })}
          />
          <div style={{ marginTop: '20px', padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: '12px', color: '#1e40af', margin: 0 }}><b>Tip:</b> High-quality images with transparent backgrounds or consistent themes work best for the app's catalog view.</p>
          </div>
        </div>
      )}
    </FormWrapper>
  );
};

export const ProductForm = ({ initialData, onSave, onClose, loading, stores = [], categories = [], subcategories = [], isManager = false }) => {
  const { user } = useAuth();

  const initialSubCatId = initialData?.sub_category_id || initialData?.subCategoryId || '';
  const matchedSub = (subcategories || []).find(s => s.id === initialSubCatId);
  const initialCatId = initialData?.category_id || initialData?.categoryId || initialData?.subCategory?.categoryId || matchedSub?.category_id || matchedSub?.categoryId || (categories[0]?.id || '');
  
  const [selectedCategory, setSelectedCategory] = useState(initialCatId);

  useEffect(() => {
    if (initialData && subcategories && subcategories.length > 0) {
      const subId = initialData.sub_category_id || initialData.subCategoryId;
      if (subId) {
        const found = subcategories.find(s => s.id === subId);
        if (found && (found.category_id || found.categoryId)) {
          setSelectedCategory(found.category_id || found.categoryId);
        }
      }
    }
  }, [subcategories, initialData]);

  const filteredSubcategories = useMemo(() => {
    if (!selectedCategory) return subcategories;
    const list = (subcategories || []).filter(s => String(s.category_id || s.categoryId) === String(selectedCategory));
    return list.length > 0 ? list : subcategories;
  }, [subcategories, selectedCategory]);

  const [formData, setFormData] = useState(() => {
    let delOpts = initialData?.delivery_options || initialData?.deliveryOptions;
    if (typeof delOpts === 'string') {
      try { delOpts = JSON.parse(delOpts); } catch { delOpts = [delOpts]; }
    }
    if (!delOpts || !Array.isArray(delOpts) || delOpts.length === 0) {
      delOpts = ['express', 'tomorrow_morning', 'tomorrow_evening'];
    }

    if (!initialData) {
      return {
        name: '', slug: '', price: 0, discount_price: '',
        express_stock_qty: 0, scheduled_stock_qty: 0,
        weight_unit: 'kg',
        store_id: isManager ? user?.store_id : (stores[0]?.id || ''),
        sub_category_id: initialSubCatId || (filteredSubcategories[0]?.id || subcategories[0]?.id || ''),
        description: '',
        cooking_guide: '',
        is_deal: false, is_featured: false, is_flash_sale: false,
        is_trending: false, is_exclusive: false, is_new_launch: false, is_frozen: false,
        delivery_options: delOpts,
        variants: []
      };
    }
    const fallbackImg = initialData.image_url || initialData.imageUrl || initialData.variants?.[0]?.image_url || initialData.variants?.[0]?.imageUrl || '';
    
    // Normalize variants from initialData
    const normalizedVariants = (initialData.variants || []).map(v => ({
      id: v.id,
      productId: v.productId || v.product_id,
      name: v.name || '',
      price: v.price ?? '',
      discount_price: v.discount_price ?? v.discountPrice ?? '',
      weight_text: v.weight_text || v.weightText || '',
      gross_weight_text: v.gross_weight_text || v.grossWeightText || '',
      description: v.description || '',
      image_url: v.image_url || v.imageUrl || '',
      imageFile: null,
      delivery_info: v.delivery_info || v.deliveryInfo || 'Tomorrow Morning',
      display_order: v.display_order ?? v.displayOrder ?? 0,
    }));

    return {
      ...initialData,
      sub_category_id: initialData.sub_category_id || initialData.subCategoryId || initialSubCatId || '',
      express_stock_qty: initialData.express_stock_qty ?? initialData.expressStockQty ?? 0,
      scheduled_stock_qty: initialData.scheduled_stock_qty ?? initialData.scheduledStockQty ?? 0,
      price: initialData.price ?? 0,
      discount_price: initialData.discount_price ?? initialData.discountPrice ?? '',
      weight_unit: initialData.weight_unit || initialData.weightUnit || 'kg',
      cooking_guide: initialData.cooking_guide || initialData.cookingGuide || '',
      is_deal: !!(initialData.is_deal ?? initialData.isDeal),
      is_featured: !!(initialData.is_featured ?? initialData.isFeatured),
      is_flash_sale: !!(initialData.is_flash_sale ?? initialData.isFlashSale),
      is_trending: !!(initialData.is_trending ?? initialData.isTrending),
      is_exclusive: !!(initialData.is_exclusive ?? initialData.isExclusive),
      is_new_launch: !!(initialData.is_new_launch ?? initialData.isNewLaunch),
      is_frozen: !!(initialData.is_frozen ?? initialData.isFrozen),
      delivery_options: delOpts,
      image_url: fallbackImg,
      variants: normalizedVariants
    };
  });
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Basics', icon: Package },
    { id: 'pricing', label: 'Pricing & Stock', icon: Save },
    { id: 'marketing', label: 'Marketing & Delivery', icon: Tag },
    { id: 'customize', label: 'Variants', icon: Layers },
    { id: 'about', label: 'About Product', icon: FileText },
    { id: 'guide', label: 'Cooking Guide', icon: Shield },
    { id: 'media', label: 'Media', icon: ImageIcon }
  ];

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Sync main product delivery_options with variant slots
    const variantSlots = new Set(formData.delivery_options || []);

    (formData.variants || []).forEach(v => {
      const info = Array.isArray(v.delivery_info)
        ? v.delivery_info
        : (v.delivery_info ? v.delivery_info.split(',').map(s => s.trim()) : []);

      info.forEach(slot => {
        variantSlots.add(slot);
      });
    });

    let mainImgUrl = formData.image_url;
    let mainImgFile = formData.imageFile;
    if (!mainImgUrl && !mainImgFile && formData.variants && formData.variants.length > 0) {
      mainImgUrl = formData.variants[0].image_url || '';
      mainImgFile = formData.variants[0].imageFile || null;
    }

    const reverseSlotMap = {
      'express': 'Express Delivery',
      'tomorrow_morning': 'Tomorrow Morning',
      'tomorrow_evening': 'Tomorrow Evening'
    };
    const defaultVariantDeliveryInfo = (formData.delivery_options || []).map(opt => reverseSlotMap[opt] || opt);

    const syncedVariants = (formData.variants || []).map(v => {
      const info = Array.isArray(v.delivery_info)
        ? [...v.delivery_info]
        : (v.delivery_info ? v.delivery_info.split(',').map(s => s.trim()) : []);

      const finalInfo = info.length > 0 ? info : [...defaultVariantDeliveryInfo];
      
      // Enforce subset rules on frontend before submit
      const sanitizedInfo = finalInfo.filter(slot => {
         const key = Object.keys(reverseSlotMap).find(k => reverseSlotMap[k] === slot) || slot.toLowerCase().replace(' ', '_');
         return (formData.delivery_options || []).includes(key);
      });

      return {
        ...v,
        delivery_info: sanitizedInfo,
        deliveryInfo: sanitizedInfo
      };
    });

    const optionsList = Array.from(variantSlots);
    const expressQty = Number(formData.express_stock_qty ?? formData.expressStockQty ?? 0);
    const scheduledQty = Number(formData.scheduled_stock_qty ?? formData.scheduledStockQty ?? 0);
    const priceNum = Number(formData.price || 0);
    const discountPriceNum = formData.discount_price !== '' && formData.discount_price !== null && formData.discount_price !== undefined ? Number(formData.discount_price) : null;

    const syncedData = {
      ...formData,
      price: priceNum,
      discount_price: discountPriceNum,
      discountPrice: discountPriceNum,
      express_stock_qty: expressQty,
      expressStockQty: expressQty,
      scheduled_stock_qty: scheduledQty,
      scheduledStockQty: scheduledQty,
      stock_quantity: expressQty + scheduledQty,
      stockQuantity: expressQty + scheduledQty,
      weight_unit: formData.weight_unit || 'kg',
      weightUnit: formData.weight_unit || 'kg',
      variants: syncedVariants,
      sub_category_id: formData.sub_category_id || formData.subCategoryId,
      subCategoryId: formData.sub_category_id || formData.subCategoryId,
      store_id: formData.store_id || formData.storeId,
      storeId: formData.store_id || formData.storeId,
      cooking_guide: formData.cooking_guide || '',
      cookingGuide: formData.cooking_guide || '',
      image_url: mainImgUrl,
      imageFile: mainImgFile,
      is_deal: !!formData.is_deal,
      isDeal: !!formData.is_deal,
      is_featured: !!formData.is_featured,
      isFeatured: !!formData.is_featured,
      is_flash_sale: !!formData.is_flash_sale,
      isFlashSale: !!formData.is_flash_sale,
      is_trending: !!formData.is_trending,
      isTrending: !!formData.is_trending,
      is_exclusive: !!formData.is_exclusive,
      isExclusive: !!formData.is_exclusive,
      is_new_launch: !!formData.is_new_launch,
      isNewLaunch: !!formData.is_new_launch,
      is_frozen: !!formData.is_frozen,
      isFrozen: !!formData.is_frozen,
      delivery_options: optionsList,
      deliveryOptions: optionsList
    };
    delete syncedData.subCategory;
    delete syncedData.sub_category;
    delete syncedData.store;

    onSave(syncedData);
  };

  return (
    <DrawerWrapper
      title={`${initialData ? 'Edit' : 'Add'} Product`}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      initialData={initialData}
    >
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })} required />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: !isManager ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
              {!isManager && <Select label="Store" value={formData.store_id} onChange={(e) => setFormData({ ...formData, store_id: e.target.value })} options={stores} />}
              <Select 
                label="Category" 
                value={selectedCategory} 
                onChange={(e) => {
                  const newCatId = e.target.value;
                  setSelectedCategory(newCatId);
                  const newSubs = subcategories.filter(s => String(s.category_id || s.categoryId) === String(newCatId));
                  setFormData(prev => ({ ...prev, sub_category_id: newSubs.length > 0 ? newSubs[0].id : '' }));
                }} 
                options={categories} 
              />
              <Select 
                label="Sub-Category" 
                value={formData.sub_category_id} 
                onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value })} 
                options={filteredSubcategories} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Short Summary</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-control"
              style={{ resize: 'none', height: '100%', minHeight: '160px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
              rows={6}
              placeholder="Product details, origin, quality etc."
            />
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Pricing Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Standard Price (₹)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              <Input label="Discount Price (₹)" type="number" value={formData.discount_price} onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })} placeholder="Optional" />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Set a discount price to show a strikethrough effect in the customer app.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Inventory Stock & Unit</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Express Stock" type="number" value={formData.express_stock_qty} onChange={(e) => setFormData({ ...formData, express_stock_qty: e.target.value })} required />
              <Input label="Scheduled Stock" type="number" value={formData.scheduled_stock_qty} onChange={(e) => setFormData({ ...formData, scheduled_stock_qty: e.target.value })} required />
            </div>
            <div style={{ marginTop: '8px' }}>
              <Select label="Unit Type" value={formData.weight_unit} onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })} options={[{ id: 'kg', name: 'kg' }, { id: 'gm', name: 'gm' }, { id: 'pcs', name: 'pcs' }]} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Marketing & Promotional Badges</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { key: 'is_deal', label: 'Deal of the Day 🔥' },
                { key: 'is_featured', label: 'Featured / Fresh Catch ⭐' },
                { key: 'is_flash_sale', label: 'Flash Sale ⚡' },
                { key: 'is_trending', label: 'Trending 📈' },
                { key: 'is_exclusive', label: 'Exclusive Offer 💎' },
                { key: 'is_new_launch', label: 'New Launch 🚀' },
                { key: 'is_frozen', label: 'Frozen Product ❄️' }
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: formData[key] ? '#f0fdf4' : '#f8fafc', border: `1px solid ${formData[key] ? '#86efac' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: formData[key] ? '600' : '400', transition: 'all 0.15s ease' }}>
                  <input
                    type="checkbox"
                    checked={!!formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Supported Delivery Slots</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Select which delivery methods the customer can order this product through.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { opt: 'express', label: 'Express Delivery (90 Min) ⚡' },
                { opt: 'tomorrow_morning', label: 'Tomorrow Morning 🌅' },
                { opt: 'tomorrow_evening', label: 'Tomorrow Evening 🌆' }
              ].map(({ opt, label }) => {
                const isChecked = (formData.delivery_options || []).includes(opt);
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: isChecked ? '#eff6ff' : '#f8fafc', border: `1px solid ${isChecked ? '#93c5fd' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: isChecked ? '600' : '400', transition: 'all 0.15s ease' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = formData.delivery_options || [];
                        const next = e.target.checked
                          ? [...current, opt]
                          : current.filter(o => o !== opt);
                        setFormData({ ...formData, delivery_options: next });
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customize' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Product Variants</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Add options like "Whole Cleaned", "Steak Cut", etc. with their own pricing.</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                variants: [
                  ...(formData.variants || []),
                  { name: '', price: '', discount_price: '', weight_text: '', gross_weight_text: '', description: '', image_url: '', imageFile: null, delivery_info: 'Tomorrow Morning' }
                ]
              })}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(formData.variants || []).length === 0 ? (
              <div style={{ padding: '40px', background: 'white', borderRadius: '12px', border: '2px dashed var(--border)', textAlign: 'center' }}>
                <Package size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No variants added yet. Click "Add Variant" to start.</p>
              </div>
            ) : (
              formData.variants.map((variant, index) => (
                <div key={index} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '24px', height: '24px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</span>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          placeholder="Variant Name (e.g. Whole Cleaned, Steak Cut)"
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...formData.variants];
                            newVariants[index].name = e.target.value;
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          style={{
                            border: '1px solid transparent',
                            borderBottom: '1px solid var(--border)',
                            background: 'white',
                            padding: '6px 0',
                            fontSize: '15px',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            width: '100%',
                            outline: 'none',
                            transition: 'all 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderBottomColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
                        />
                        {!variant.name && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px', fontWeight: '500' }}>* Required field</div>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = formData.variants.filter((_, i) => i !== index);
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
                    {/* Left Col: Imagery & Metadata */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ImageInput
                        label="Variant Image"
                        value={variant.image_url}
                        onChange={(url) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].image_url = url;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        onFileChange={(file) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].imageFile = file;
                          newVariants[index].image_url = '';
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        imageFile={variant.imageFile}
                      />
                      <Input
                        label="Tooltip Info / Desc"
                        placeholder="Price based on Gross Weight..."
                        value={variant.description}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].description = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                    </div>

                    {/* Middle Col: Pricing */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Input
                        label="Price (₹)"
                        type="number"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].price = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <Input
                        label="Discount Price (₹)"
                        type="number"
                        value={variant.discount_price}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].discount_price = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Slots</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { id: 'express', label: 'Express Delivery' },
                            { id: 'tomorrow_morning', label: 'Tomorrow Morning' },
                            { id: 'tomorrow_evening', label: 'Tomorrow Evening' }
                          ].map(slot => {
                            const current = Array.isArray(variant.delivery_info)
                              ? variant.delivery_info
                              : (variant.delivery_info ? variant.delivery_info.split(',').map(s => s.trim()) : []);
                              
                            const isSupportedByProduct = (formData.delivery_options || []).includes(slot.id);
                            const isActive = current.includes(slot.id) && isSupportedByProduct;

                            return (
                              <label 
                                key={slot.id} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  cursor: isSupportedByProduct ? 'pointer' : 'not-allowed', 
                                  fontSize: '12px',
                                  opacity: isSupportedByProduct ? 1 : 0.4
                                }}
                                title={!isSupportedByProduct ? 'Must be enabled at the product level first' : ''}
                              >
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  disabled={!isSupportedByProduct}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...current, slot.id]
                                      : current.filter(s => s !== slot.id);
                                    const newVariants = [...formData.variants];
                                    newVariants[index].delivery_info = next;
                                    setFormData({ ...formData, variants: newVariants });
                                  }}
                                  style={{ width: '14px', height: '14px', accentColor: 'var(--primary)', cursor: isSupportedByProduct ? 'pointer' : 'not-allowed' }}
                                />
                                <span>{slot.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Weight Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Input
                        label="Net Weight Text"
                        placeholder="500g"
                        value={variant.weight_text}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].weight_text = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                      <Input
                        label="Gross Weight Text"
                        placeholder="715g"
                        value={variant.gross_weight_text}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index].gross_weight_text = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product Description / Story</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-control"
              style={{ resize: 'none', minHeight: '180px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
              placeholder="Tell the story of this product..."
            />
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>This content appears in the <b>About</b> tab on the mobile app.</p>
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cooking Guide / Recipe Instructions</label>
            <textarea
              value={formData.cooking_guide || ''}
              onChange={(e) => setFormData({ ...formData, cooking_guide: e.target.value })}
              className="form-control"
              style={{
                resize: 'none',
                minHeight: '320px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                background: 'white',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
              }}
              placeholder="Step 1: Clean the fish...
Step 2: Marinate with salt and turmeric...
Step 3: Fry until golden brown..."
            />
          </div>
          <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>i</div>
            <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>This recipe will be displayed in the <b>Cooking Guide</b> tab on the mobile app product page.</p>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div style={{ maxWidth: '500px' }}>
          <ImageInput
            label="Main Product Image"
            value={formData.image_url}
            imageFile={formData.imageFile}
            onChange={(url) => setFormData({ ...formData, image_url: url, imageFile: null })}
            onFileChange={(file) => setFormData({ ...formData, imageFile: file, image_url: '' })}
          />
        </div>
      )}
    </DrawerWrapper>
  );
};

export const StoreForm = ({ initialData, onSave, onClose, loading, managers = [] }) => {
  const [formData, setFormData] = useState(() => {
    if (!initialData) {
      return {
        name: '', pincode: '', address: '', phone: '', email: '',
        manager_user_id: '', latitude: '', longitude: '', delivery_radius_km: 10,
        serviceable_pincodes: []
      };
    }
    return {
      ...initialData,
      delivery_radius_km: initialData.delivery_radius_km ?? initialData.deliveryRadiusKm ?? 10,
      serviceable_pincodes: initialData.serviceable_pincodes ?? initialData.serviceablePincodes ?? [],
      manager_user_id: initialData.manager_user_id ?? initialData.managerUserId ?? '',
    };
  });
  const [locating, setLocating] = useState(false);

  const managerOptions = [{ id: '', name: 'Unassigned' }, ...managers];

  const handleCaptureLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7)
        }));
        setLocating(false);
      },
      (err) => {
        alert('Failed to get location: ' + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    let pins = formData.serviceable_pincodes;
    if (typeof pins === 'string') {
      pins = pins.split(/[\s,]+/).map(p => p.trim()).filter(p => p.length === 6);
    } else if (Array.isArray(pins)) {
      pins = pins.map(p => String(p).trim()).filter(p => p.length === 6);
    } else {
      pins = [];
    }

    const rad = formData.delivery_radius_km !== undefined && formData.delivery_radius_km !== ''
      ? parseFloat(formData.delivery_radius_km) || 10
      : 10;

    const cleanedData = {
      ...formData,
      name: formData.name ? formData.name.trim() : '',
      address: formData.address ? formData.address.trim() : '',
      pincode: formData.pincode ? String(formData.pincode).trim() : '',
      phone: formData.phone || '',
      email: formData.email || '',
      latitude: formData.latitude ? String(formData.latitude) : '',
      longitude: formData.longitude ? String(formData.longitude) : '',
      delivery_radius_km: rad,
      deliveryRadiusKm: rad,
      manager_user_id: formData.manager_user_id || null,
      managerUserId: formData.manager_user_id || null,
      serviceable_pincodes: pins,
      serviceablePincodes: pins
    };

    delete cleanedData.manager;
    delete cleanedData.dependencies;
    delete cleanedData.createdAt;
    delete cleanedData.updatedAt;

    onSave(cleanedData);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-slide-in-right" style={{
        width: '100%',
        maxWidth: '1260px',
        height: '100%',
        background: 'white',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: '-10px 0 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {initialData ? 'Edit Store Location' : 'Add Physical Store Location'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Set up store parameters, delivery area, and pinpoint exact map coordinates
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: '#f1f5f9' }}><X size={20} /></button>
        </div>

        {/* 2-Column Split Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left Column: Store Details & Coverage */}
          <div style={{
            width: '460px',
            borderRight: '1px solid var(--border)',
            padding: '20px 24px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Store Info & Location
            </h3>
            <Input label="Store Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Physical Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Road, Area, Building..." required />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="PIN Code" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required />
              <Input label="Radius (KM)" type="number" value={formData.delivery_radius_km} onChange={(e) => setFormData({ ...formData, delivery_radius_km: e.target.value })} />
            </div>

            <Select label="Assigned Store Manager" value={formData.manager_user_id || ''} onChange={(e) => setFormData({ ...formData, manager_user_id: e.target.value })} options={managerOptions} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            {/* Live GPS Coordinates Readout */}
            <div style={{ background: 'white', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  GPS Coordinates
                </span>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={locating}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--primary)',
                    background: '#f0fdf4',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MapPin size={12} /> {locating ? 'Locating...' : 'My Location'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input readOnly placeholder="Latitude" value={formData.latitude} style={{ fontSize: '12px', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', color: '#1e293b', fontWeight: '600' }} />
                <input readOnly placeholder="Longitude" value={formData.longitude} style={{ fontSize: '12px', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', color: '#1e293b', fontWeight: '600' }} />
              </div>
            </div>

            {/* Serviceable Pincodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Serviceable PIN Codes (Comma separated)
              </label>
              <textarea
                value={Array.isArray(formData.serviceable_pincodes) ? formData.serviceable_pincodes.join(', ') : (formData.serviceable_pincodes || '')}
                onChange={(e) => setFormData({ ...formData, serviceable_pincodes: e.target.value })}
                className="form-control"
                style={{ resize: 'none', minHeight: '80px', fontSize: '13px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                rows={3}
                placeholder="e.g. 201301, 201305, 201318..."
              />
            </div>
          </div>

          {/* Right Column: Prominent Interactive Google Map */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--primary)" /> Pinpoint Location On Map
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Search by address, drag the marker, or click anywhere to position store coordinates
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '520px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
              <GoogleMapPicker
                lat={formData.latitude}
                lng={formData.longitude}
                onSelect={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                onAddressSelect={(addr) => setFormData(prev => ({ ...prev, address: prev.address || addr }))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'white',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-compact"
            style={{ minWidth: '100px', background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: '600' }}
          >
            Cancel
          </button>
          <button
            disabled={loading}
            type="button"
            onClick={handleSubmit}
            className="btn-compact"
            style={{
              minWidth: '150px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '600',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : (initialData ? 'Save Store Changes' : 'Create Store')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const StaffForm = ({ onSave, onClose, loading, stores = [], type = 'rider' }) => {
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', phone: '', role: type,
    store_id: stores[0]?.id || '', vehicle_type: 'bike', vehicle_number: ''
  });
  const [activeTab, setActiveTab] = useState('account');

  const getTitle = () => {
    switch (type) {
      case 'rider': return 'Onboard New Rider';
      case 'store_manager': return 'Onboard New Manager';
      case 'customer': return 'Create New Customer';
      default: return 'Add New User';
    }
  };

  const tabs = [
    { id: 'account', label: 'Account Details', icon: Shield },
    type === 'rider' ? { id: 'vehicle', label: 'Vehicle Info', icon: Package } : null
  ].filter(Boolean);

  return (
    <FormWrapper
      title={getTitle()}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
      loading={loading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'account' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            {type !== 'customer' && <Select label="Assign to Store" value={formData.store_id} onChange={(e) => setFormData({ ...formData, store_id: e.target.value })} options={stores} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="System Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>
        </div>
      )}

      {activeTab === 'vehicle' && type === 'rider' && (
        <div style={{ maxWidth: '500px' }}>
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select label="Vehicle Type" value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} options={[{ id: 'bike', name: 'Bike' }, { id: 'scooter', name: 'Scooter' }, { id: 'bicycle', name: 'Bicycle' }]} />
            <Input label="Vehicle Number" value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} placeholder="e.g. WB 1234" />
          </div>
        </div>
      )}
    </FormWrapper>
  );
};

export const BannerForm = ({ initialData, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState(initialData || { title: '', image_url: '', link_url: '', placement: 'hero', display_order: 0, is_active: true });

  const placementOptions = [
    { id: 'hero', name: 'Hero Carousel' },
    { id: 'promotional', name: 'Promotional Banner' },
    { id: 'category_page', name: 'Category Page Banner' }
  ];

  return (
    <FormWrapper
      title={`${initialData ? 'Edit' : 'Add'} Banner`}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
      loading={loading}
      initialData={initialData}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Banner Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          <Input label="Link URL (Optional)" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} placeholder="/category/fish" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select label="Placement" value={formData.placement} onChange={(e) => setFormData({ ...formData, placement: e.target.value })} options={placementOptions} />
            <Input label="Display Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '8px' }}>
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            <span>Active (Visible to users)</span>
          </label>
        </div>
        <div>
          <ImageInput
            label="Banner Image"
            value={formData.image_url}
            imageFile={formData.imageFile}
            onChange={(url) => setFormData({ ...formData, image_url: url, imageFile: null })}
            onFileChange={(file) => setFormData({ ...formData, imageFile: file, image_url: '' })}
          />
        </div>
      </div>
    </FormWrapper>
  );
};

export const HomeSectionForm = ({ initialData, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState(initialData || { title: '', subtitle: '', is_active: true, display_order: 0 });

  return (
    <FormWrapper
      title="Edit Home Section"
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
      loading={loading}
      initialData={initialData}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
        <Input label="Section Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        <Input label="Section Subtitle" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
        <Input label="Display Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
          <span>Section Active</span>
        </label>
      </div>
    </FormWrapper>
  );
};

export const NotificationForm = ({ targetName, onClose, onSend, loading, initialData }) => {
  const [formData, setFormData] = useState(initialData || { title: '', body: '', data: {} });

  return (
    <FormWrapper
      title={`Notify ${targetName}`}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onSend(formData); }}
      loading={loading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
        <Input label="Notification Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g. Action Required" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Message Body</label>
          <textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="form-control"
            style={{ resize: 'none', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
            required
            placeholder="Type your message here..."
          />
        </div>
      </div>
    </FormWrapper>
  );
};

