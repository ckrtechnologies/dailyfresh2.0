import React, { useState } from 'react';
import { Loader2, Save, X, Image as ImageIcon, Link as LinkIcon, Upload, Tag, Layers, Package, User, Store as StoreIcon, Shield, FileText } from 'lucide-react';

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

const Select = ({ label, options, value, ...props }) => (
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
      {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
    </select>
  </div>
);

const FormWrapper = ({ title, onClose, onSubmit, loading, children, tabs = [], activeTab, onTabChange, initialData }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
            <Select label="Parent Category" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} options={categories} />
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

export const ProductForm = ({ initialData, onSave, onClose, loading, stores = [], subcategories = [], isManager = false }) => {
  const [formData, setFormData] = useState(initialData || { 
    name: '', slug: '', price: 0, discount_price: '', stock_quantity: 0, weight_unit: 'kg', 
    store_id: stores[0]?.id || '', sub_category_id: subcategories[0]?.id || '', description: '',
    is_deal: false, is_featured: false
  });
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Basics', icon: Package },
    { id: 'pricing', label: 'Inventory & Pricing', icon: Save },
    { id: 'about', label: 'About', icon: FileText },
    { id: 'guide', label: 'Cooking Guide', icon: Shield },
    { id: 'media', label: 'Media', icon: ImageIcon }
  ];

  return (
    <FormWrapper 
      title={`${initialData ? 'Edit' : 'Add'} Product`} 
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
            <Input label="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })} required />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {!isManager && <Select label="Store" value={formData.store_id} onChange={(e) => setFormData({ ...formData, store_id: e.target.value })} options={stores} />}
              <Select label="Sub-Category" value={formData.sub_category_id} onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value })} options={subcategories} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
            <textarea 
              value={formData.description || ''} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="form-control" 
              style={{ 
                resize: 'none', 
                minHeight: '160px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none'
              }} 
              rows={6} 
              placeholder="Product details, origin, quality etc."
            />
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Pricing Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Standard Price (₹)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              <Input label="Discount Price (₹)" type="number" value={formData.discount_price} onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })} placeholder="Optional" />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Set a discount price to show a strikethrough effect in the app.</p>
          </div>
          
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Stock & Units</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Available Stock" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} required />
              <Select label="Unit Type" value={formData.weight_unit} onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })} options={[{ id: 'kg', name: 'kg' }, { id: 'gm', name: 'gm' }, { id: 'pcs', name: 'pcs' }]} />
            </div>

            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '24px 0 16px', color: 'var(--text-main)' }}>Marketing & Flags</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={formData.is_deal} onChange={(e) => setFormData({ ...formData, is_deal: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                <span>Deal of the Day</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                <span>Featured / Fresh</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={formData.is_flash_sale} onChange={(e) => setFormData({ ...formData, is_flash_sale: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                <span>Flash Sale ⚡</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={formData.is_trending} onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                <span>Trending 🔥</span>
              </label>
            </div>

            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: '24px 0 16px', color: 'var(--text-main)' }}>Delivery Options</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {['morning', 'afternoon', 'express'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={(formData.delivery_options || ['morning', 'afternoon', 'express']).includes(opt)} 
                    onChange={(e) => {
                      const current = formData.delivery_options || ['morning', 'afternoon', 'express'];
                      const next = e.target.checked 
                        ? [...current, opt]
                        : current.filter(o => o !== opt);
                      setFormData({ ...formData, delivery_options: next });
                    }} 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} 
                  />
                  <span style={{ textTransform: 'capitalize' }}>{opt} Delivery</span>
                </label>
              ))}
            </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cooking Guide / Instructions</label>
            <textarea 
              value={formData.cooking_guide || ''} 
              onChange={(e) => setFormData({ ...formData, cooking_guide: e.target.value })} 
              className="form-control" 
              style={{ resize: 'none', minHeight: '250px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} 
              placeholder="Step 1: Clean the fish...
Step 2: Marinate with salt and turmeric..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cooking Guide Highlights (JSON Array)</label>
            <textarea 
              value={typeof formData.product_highlights === 'string' ? formData.product_highlights : JSON.stringify(formData.product_highlights || [], null, 2)} 
              onChange={(e) => setFormData({ ...formData, product_highlights: e.target.value })} 
              className="form-control" 
              style={{ resize: 'none', minHeight: '250px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', fontFamily: 'monospace' }} 
              placeholder='[
  {"icon": "ChefHat", "text": "Wash thoroughly"},
  {"icon": "Fire", "text": "Cook for 10 mins"}
]'
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enter a JSON array of objects with "icon" and "text" keys. Icons: ChefHat, Fire, Knife, Timer, Scale.</p>
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
    </FormWrapper>
  );
};

export const StoreForm = ({ initialData, onSave, onClose, loading, managers = [] }) => {
  const [formData, setFormData] = useState(initialData || { 
    name: '', pincode: '', address: '', phone: '', email: '', 
    manager_user_id: '', latitude: '', longitude: '', delivery_radius_km: 10,
    serviceable_pincodes: []
  });
  const [activeTab, setActiveTab] = useState('details');
  const [locating, setLocating] = useState(false);

  const managerOptions = [{ id: '', name: 'Unassigned' }, ...managers];

  const handleCaptureLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({ 
          ...formData, 
          latitude: pos.coords.latitude.toFixed(7), 
          longitude: pos.coords.longitude.toFixed(7) 
        });
        setLocating(false);
      },
      (err) => {
        alert('Failed to get location: ' + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const tabs = [
    { id: 'details', label: 'Store Details', icon: StoreIcon },
    { id: 'serviceable', label: 'Serviceable Areas', icon: Layers },
    { id: 'contact', label: 'Contact Info', icon: User }
  ];

  return (
    <FormWrapper 
      title={`${initialData ? 'Edit' : 'Add'} Store`} 
      onClose={onClose} 
      onSubmit={(e) => { 
        e.preventDefault(); 
        const cleanedData = {
          ...formData,
          serviceable_pincodes: typeof formData.serviceable_pincodes === 'string' 
            ? formData.serviceable_pincodes.split(/[\s,]+/).filter(p => p.trim().length === 6).map(p => p.trim())
            : formData.serviceable_pincodes
        };
        onSave(cleanedData); 
      }} 
      loading={loading}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      initialData={initialData}
    >
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input label="Store Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="PIN Code" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required />
            <Input label="Delivery Radius (KM)" type="number" value={formData.delivery_radius_km} onChange={(e) => setFormData({ ...formData, delivery_radius_km: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            <Select label="Assigned Manager" value={formData.manager_user_id || ''} onChange={(e) => setFormData({ ...formData, manager_user_id: e.target.value })} options={managerOptions} />
            
            <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>GPS COORDINATES</span>
                <button 
                  type="button" 
                  onClick={handleCaptureLocation}
                  disabled={locating}
                  style={{ fontSize: '10px', background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {locating ? 'Locating...' : 'Capture Current'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input readOnly placeholder="Lat" value={formData.latitude} style={{ fontSize: '12px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#e2e8f0' }} />
                <input readOnly placeholder="Lng" value={formData.longitude} style={{ fontSize: '12px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#e2e8f0' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'serviceable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>Multi-Pincode Delivery</h4>
            <p style={{ fontSize: '12px', color: '#1e40af', margin: 0, lineHeight: '1.5' }}>
              List all the PIN codes this store should serve. The app will automatically mark these areas as serviceable. 
              Separate multiple codes with <b>commas</b> or <b>new lines</b>.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Serviceable PIN Codes</label>
            <textarea 
              value={Array.isArray(formData.serviceable_pincodes) ? formData.serviceable_pincodes.join(', ') : (formData.serviceable_pincodes || '')} 
              onChange={(e) => setFormData({ ...formData, serviceable_pincodes: e.target.value })} 
              className="form-control" 
              style={{ resize: 'none', minHeight: '180px', fontSize: '14px', letterSpacing: '0.5px', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} 
              rows={8} 
              placeholder="e.g. 201301, 201305, 201318..."
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Only valid 6-digit codes will be saved.</p>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          <Input label="Official Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        </div>
      )}
    </FormWrapper>
  );
};

export const StaffForm = ({ onSave, onClose, loading, stores = [], type = 'rider' }) => {
  const [formData, setFormData] = useState({ 
    email: '', password: '', full_name: '', phone: '', role: type, 
    store_id: stores[0]?.id || '', vehicle_type: 'bike', vehicle_number: '' 
  });
  const [activeTab, setActiveTab] = useState('account');

  const getTitle = () => {
    switch(type) {
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
            <Select label="Vehicle Type" value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} options={[{id: 'bike', name: 'Bike'}, {id: 'scooter', name: 'Scooter'}, {id: 'bicycle', name: 'Bicycle'}]} />
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
