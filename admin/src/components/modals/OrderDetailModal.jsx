import React from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Clock, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#10b981';
      case 'cancelled':
      case 'failed': return '#ef4444';
      case 'out_for_delivery':
      case 'picked_up': return '#8b5cf6';
      case 'ready': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        background: 'white',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              Order Detail #{order.order_number}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', margin: 0 }}>
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#94a3b8',
              padding: '8px',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Left Column: Customer & Delivery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Status Banner */}
              <div style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                backgroundColor: `${getStatusColor(order.status)}10`,
                border: `1px solid ${getStatusColor(order.status)}30`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: getStatusColor(order.status) 
                }} />
                <span style={{ fontWeight: 'bold', color: getStatusColor(order.status), textTransform: 'uppercase', fontSize: '13px' }}>
                  Current Status: {order.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Delivery Information */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> Delivery Information
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Mode</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      marginTop: '4px',
                      color: order.delivery_type === 'express' ? '#8b5cf6' : '#b91c1c'
                    }}>
                      {order.delivery_type === 'express' ? '⚡ EXPRESS' : '📅 SCHEDULED'}
                    </div>
                  </div>
                  {order.delivery_slot_label && (
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Time Window</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: '#1e293b' }}>
                        {order.delivery_slot_label}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} /> Customer Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>{order.customer?.full_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{order.customer?.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{order.customer?.email}</div>
                    </div>
                  </div>
                  <a 
                    href={`tel:${order.customer?.phone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}
                  >
                    <Phone size={14} color="#3b82f6" /> {order.customer?.phone}
                  </a>
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> Delivery Address
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {order.delivery_address?.line1 || order.address_line1}, {order.delivery_address?.line2}<br />
                  {order.delivery_address?.city}, {order.delivery_address?.pincode}
                </p>
                {order.delivery_address?.latitude && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_address.latitude},${order.delivery_address.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      marginTop: '12px', 
                      fontSize: '12px', 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: '600'
                    }}
                  >
                    View on Map <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Right Column: Items & Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Order Items */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={16} /> Order Items ({order.items?.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img 
                          src={item.product?.image_url || 'https://via.placeholder.com/40'} 
                          alt="" 
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.product?.name || item.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Qty: {item.quantity} × ₹{item.unit_price || item.price}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>₹{item.total_price}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span>₹{order.total_amount - (order.delivery_charge || 0) - (order.gst_amount || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Delivery Fee</span>
                    <span>₹{order.delivery_charge || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>
                    <span>Total Paid</span>
                    <span style={{ color: '#3b82f6', fontSize: '18px' }}>₹{order.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Rider Section */}
              {order.rider ? (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f0fdf4', backgroundColor: '#f0fdf4' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} /> Assigned Rider
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>{order.rider.full_name}</div>
                      <a 
                        href={`tel:${order.rider.phone}`}
                        style={{ fontSize: '12px', color: '#166534', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {order.rider.phone}
                      </a>
                    </div>
                    <a 
                      href={`tel:${order.rider.phone}`}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        backgroundColor: 'white', 
                        border: '1px solid #bcf0da',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textDecoration: 'none'
                      }}
                    >
                      Call Rider
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7', backgroundColor: '#fffbeb', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>Waiting for Rider Assignment</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button 
            onClick={onClose}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              background: 'white',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button 
            onClick={() => window.print()}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              background: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
